import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Avatar, Button, Input, Select } from '../../../ui'
import { useMeta } from '../../../../context/meta'
import { notify } from '../../../../utils/notify'
import account from '../../../../services/account.services'

// Matches what the server accepts, so a file it will refuse is never uploaded.
const MAX_MB = 5

const Profile = ({ me, onChange }) => {
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)

  const { countries, ready: metaReady } = useMeta()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      username: me.username,
      phone: me.phone ?? '',
      phoneCountryId: me.phoneCountryId ?? null,
    },
  })

  const save = async (values) => {
    try {
      onChange(await account.updateProfile(values))
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
    <section className="panel p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        This is what buyers see next to anything you sell.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Avatar account={me} size="lg" />

        <div className="flex flex-wrap gap-2">
          <Button.Action variant="soft" size="sm" loading={busy} onClick={() => fileInput.current?.click()}>
            {me.avatar ? 'Change photo' : 'Upload photo'}
          </Button.Action>
          {me.avatar && (
            <Button.Action variant="ghost" size="sm" disabled={busy} onClick={removePhoto}>
              Remove
            </Button.Action>
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

        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
          <Controller
            name="phoneCountryId"
            control={control}

            render={({ field }) => (
              <Select
                label="Country code"
                options={countries.map(c => ({
                  value: c.value,
                  label: c.label,
                  subtitle: c.dialCode ? `+${c.dialCode}` : undefined,
                }))}
                value={field.value}
                onChange={field.onChange}
                placeholder={metaReady ? 'Choose' : 'Loading…'}
                disabled={!metaReady}
                error={errors.phoneCountryId?.message}
              />
            )}
          />

          <Input
            label="Phone"
            optional
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="300 123 4567"
            hint="Only shared once an order is agreed. Your email is shared either way."
            error={errors.phone?.message}
            {...register('phone', {
              validate: value => {
                const digits = String(value ?? '').replace(/\D/g, '')
                // Empty is how the field is cleared, so it cannot be an error.
                return !digits || digits.length >= 6 || 'That number is too short.'
              },
            })}
          />
        </div>

        <div>
          <Button.Action type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button.Action>
        </div>
      </form>
    </section>
  )
}

export default Profile
