import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Avatar, Button, Input } from '../../../ui'
import { notify } from '../../../../utils/notify'
import account from '../../../../services/account.services'

// Matches what the server accepts, so a file it will refuse is never uploaded.
const MAX_MB = 5

const Profile = ({ me, onChange }) => {
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ defaultValues: { username: me.username } })

  const save = async ({ username }) => {
    try {
      onChange(await account.updateProfile({ username }))
      notify('Your name was updated.', 'success')
    } catch {
      // Already reported by the response interceptor.
    }
  }

  const pick = async (event) => {
    const file = event.target.files?.[0]
    // The input is cleared straight away so picking the same file twice still
    // fires a change event.
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_MB * 1024 * 1024) {
      return notify(`That image is over ${MAX_MB} MB. Use a smaller one.`, 'error')
    }

    setBusy(true)
    try {
      onChange(await account.uploadAvatar(file))
      notify('Photo updated.', 'success')
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  const removePhoto = async () => {
    setBusy(true)
    try {
      onChange(await account.deleteAvatar())
      notify('Photo removed.', 'success')
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-6">
      <h2 className="text-lg font-medium">Profile</h2>
      <p className="mt-0.5 text-sm text-plaza-muted">
        This is what buyers see next to anything you sell.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Avatar account={me} size="lg" />

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" loading={busy} onClick={() => fileInput.current?.click()}>
            {me.avatar ? 'Change photo' : 'Upload photo'}
          </Button>
          {me.avatar && (
            <Button variant="ghost" size="sm" disabled={busy} onClick={removePhoto}>
              Remove
            </Button>
          )}
          {/* The native control is hidden rather than styled: it cannot be
              restyled reliably across browsers, and a button that opens it
              gives the same behaviour with the design we want. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={pick}
            className="sr-only"
            tabIndex={-1}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(save)} className="mt-6 flex flex-col gap-4">
        <Input
          label="Name"
          hint="Shown on your listings and reviews."
          error={errors.username?.message}
          {...register('username', {
            required: 'Pick a name to go by.',
            minLength: { value: 3, message: 'Use at least 3 characters.' },
            maxLength: { value: 40, message: 'Keep it under 40 characters.' },
          })}
        />

        <div>
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
            Save name
          </Button>
        </div>
      </form>
    </section>
  )
}

export default Profile
