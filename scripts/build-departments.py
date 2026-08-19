"""Turns Colombia's official department boundaries into something a browser can carry.

The source is geoBoundaries ADM1 for Colombia (open licence), which is 1.2 MB
of coastline surveyed to the metre. A picker that highlights a department does
not need the metre: at the zoom where somebody chooses "Antioquia" a hundred
metres is a fraction of a pixel, and the difference between the two is most of
the download.

Two reductions, in this order:

  * coordinates rounded to three decimals, which is about 110 m
  * points that collapse onto each other after rounding, dropped

Nothing is smoothed and no shape is redrawn — the outline stays the official
one, sampled less finely.

The names are mapped onto the values `geo.cities.region` actually holds, because
that column is what the filter compares against. Two do not match:

  * the archipelago, whose official name is far longer than the one the cities
    table uses
  * Bogotá, which geoBoundaries treats as its own first-level division and the
    cities table files under Cundinamarca

Bogotá is mapped to Cundinamarca rather than dropped. Clicking it has to filter
*something*, and the listings that are in Bogotá are filed under Cundinamarca —
so that is where clicking Bogotá takes you, and the two polygons light up
together to say so.

Usage: python scripts/build-departments.py <source.geojson>
"""
import json
import pathlib
import sys

PRECISION = 3

# Douglas-Peucker, in degrees. Roughly a kilometre — which at the zoom where
# somebody picks a department is a fraction of a pixel, and is the difference
# between a file that downloads and one that is noticed.
#
# Rounding alone was tried first and gave 682 kB: it throws away points evenly,
# including the ones a coastline needs. This throws away the points that were
# never carrying the shape and keeps the corners, which is why it can be far
# more aggressive without the outline looking chewed.
TOLERANCE = 0.01

# geoBoundaries' name -> the value geo.cities.region holds.
ALIASES = {
    "Archipiélago de San Andrés, Providencia y Santa Catalina": "San Andrés y Providencia",
    "Bogota Capital District": "Cundinamarca",
}

source = pathlib.Path(sys.argv[1])
target = pathlib.Path(__file__).resolve().parent.parent / "public" / "departments.geojson"

data = json.loads(source.read_text(encoding="utf-8"))


def perpendicular(point, start, end):
    """How far a point sits off the line between two others."""
    (x, y), (x1, y1), (x2, y2) = point, start, end

    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5

    return abs(dy * x - dx * y + x2 * y1 - y2 * x1) / (dx * dx + dy * dy) ** 0.5


def simplify(points, tolerance):
    """Douglas-Peucker: keep the corners, drop what lies along the line."""
    if len(points) < 3:
        return points

    # The furthest point from the line joining the ends. If even that one is
    # within tolerance, every point between them is, and the whole run
    # collapses to its two endpoints.
    worst, index = 0.0, 0
    for i in range(1, len(points) - 1):
        away = perpendicular(points[i], points[0], points[-1])
        if away > worst:
            worst, index = away, i

    if worst <= tolerance:
        return [points[0], points[-1]]

    left = simplify(points[: index + 1], tolerance)
    right = simplify(points[index:], tolerance)

    return left[:-1] + right


def thin(ring):
    """Simplify a ring, round what survives, and drop coincident points."""
    ring = simplify(ring, TOLERANCE)

    out = []
    for lng, lat in ring:
        point = [round(lng, PRECISION), round(lat, PRECISION)]
        if not out or out[-1] != point:
            out.append(point)

    # A ring needs to close, and needs enough points left to be a shape at all.
    if len(out) < 4:
        return None
    if out[0] != out[-1]:
        out.append(out[0])

    return out


def walk(geometry):
    kind = geometry["type"]

    if kind == "Polygon":
        rings = [thin(r) for r in geometry["coordinates"]]
        rings = [r for r in rings if r]
        return {"type": "Polygon", "coordinates": rings} if rings else None

    if kind == "MultiPolygon":
        polygons = []
        for polygon in geometry["coordinates"]:
            rings = [thin(r) for r in polygon]
            rings = [r for r in rings if r]
            if rings:
                polygons.append(rings)
        return {"type": "MultiPolygon", "coordinates": polygons} if polygons else None

    raise SystemExit(f"unexpected geometry: {kind}")


features = []
unmapped = []

for feature in data["features"]:
    name = feature["properties"]["shapeName"]
    region = ALIASES.get(name, name)
    geometry = walk(feature["geometry"])

    if not geometry:
        unmapped.append(name)
        continue

    features.append({
        "type": "Feature",
        # Only what the picker reads: the label it draws and the value it
        # filters by. Everything else geoBoundaries ships is weight.
        "properties": {"name": name, "region": region},
        "geometry": geometry,
    })

out = {"type": "FeatureCollection", "features": features}

# Separators without spaces: a megabyte of ", " is still a megabyte.
target.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

before = source.stat().st_size
after = target.stat().st_size

print(f"{len(features)} departamentos")
print(f"{before // 1024} kB -> {after // 1024} kB  ({100 - after * 100 // before}% menos)")
if unmapped:
    print("sin geometría:", ", ".join(unmapped))
