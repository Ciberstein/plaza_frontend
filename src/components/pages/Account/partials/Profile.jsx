import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Avatar, Button, Input, Select } from '../../../ui'
import { useMeta } from '../../../../context/meta'
import { notify } from '../../../../utils/notify'
import account from '../../../../services/account.services'

// Matches what the server accepts, so a file it will refuse is never uploaded.
const MAX_MB = 5

const Profile = ({ me, onChange }) => {
  const { t } = useTranslation()
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
      notify(t('Profile.NameUpdated'), 'success')
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
      return notify(t('Profile.PhotoTooBig', { max: MAX_MB }), 'error')
    }

    setBusy(true)
    try {
      onChange(await account.uploadAvatar(file))
      notify(t('Profile.PhotoUpdated'), 'success')
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
      notify(t('Profile.PhotoRemoved'), 'success')
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">{t('Profile.Title')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {t('Profile.Intro')}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Avatar account={me} size="lg" />

        <div className="flex flex-wrap gap-2">
          <Button.Action variant="soft" size="sm" loading={busy} onClick={() => fileInput.current?.click()}>
            {me.avatar ? t('Profile.ChangePhoto') : t('Profile.UploadPhoto')}
          </Button.Action>
          {me.avatar && (
            <Button.Action variant="ghost" size="sm" disabled={busy} onClick={removePhoto}>
              {t('Profile.RemovePhoto')}
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
          label={t('Profile.Name.Label')}
          hint={t('Profile.Name.Hint')}
          error={errors.username?.message}
          {...register('username', {
            required: t('Access.Username.Required'),
            minLength: { value: 3, message: t('ShopRequest.Name.MinLength') },
            maxLength: { value: 40, message: t('Profile.Name.MaxLength') },
          })}
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
          <Controller
            name="phoneCountryId"
            control={control}

            render={({ field }) => (
              <Select
                label={t('Profile.CountryCode.Label')}
                options={countries.map(c => ({
                  value: c.value,
                  label: c.label,
                  subtitle: c.dialCode ? `+${c.dialCode}` : undefined,
                }))}
                value={field.value}
                onChange={field.onChange}
                placeholder={metaReady ? t('Profile.CountryCode.Placeholder') : t('Common.Loading')}
                disabled={!metaReady}
                error={errors.phoneCountryId?.message}
              />
            )}
          />

          <Input
            label={t('Profile.Phone.Label')}
            optional
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="300 123 4567"
            hint={t('Profile.Phone.Hint')}
            error={errors.phone?.message}
            {...register('phone', {
              validate: value => {
                const digits = String(value ?? '').replace(/\D/g, '')
                // Empty is how the field is cleared, so it cannot be an error.
                return !digits || digits.length >= 6 || t('Profile.Phone.TooShort')
              },
            })}
          />
        </div>

        <div>
          <Button.Action type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
            {t('Editor.SaveChanges')}
          </Button.Action>
        </div>
      </form>
    </section>
  )
}

export default Profile
