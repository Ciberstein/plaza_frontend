import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../ui'
import { useAuth } from '../../../context/auth'

/**
 * One page for both signing in and creating an account.
 *
 * They are the same decision from the visitor's side — "get me into my account"
 * — and splitting them across two routes makes someone who guessed wrong start
 * over. The toggle keeps whatever they already typed.
 */
const Access = ({ mode = 'login' }) => {
  const [creating, setCreating] = useState(mode === 'register')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { username: '', email: '', password: '' } })

  const onSubmit = async (values) => {
    try {
      if (creating) {
        await signUp(values)
      } else {
        await signIn({ email: values.email, password: values.password })
      }
      // Back to wherever the guard interrupted, or the square.
      navigate(location.state?.from ?? '/', { replace: true })
    } catch {
      // The interceptor has already shown what went wrong.
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight">
        {creating ? 'Create your account' : 'Sign in'}
      </h1>
      <p className="mt-1 text-sm text-plaza-mute">
        {creating
          ? 'One account to buy and to sell. You can open a shop straight after.'
          : 'Welcome back.'}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-5 rounded-plaza border border-plaza-line bg-plaza-paper p-5"
      >
        {creating && (
          <Input
            label="Username"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username', { required: 'Pick a name to go by.' })}
          />
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', { required: 'Your email is required.' })}
        />

        <Input
          label="Password"
          type="password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          hint={creating ? 'At least 8 characters.' : undefined}
          error={errors.password?.message}
          {...register('password', {
            required: 'Your password is required.',
            minLength: creating
              ? { value: 8, message: 'Use at least 8 characters.' }
              : undefined,
          })}
        />

        <Button type="submit" full loading={isSubmitting}>
          {creating ? 'Create account' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-plaza-mute">
          {creating ? 'Already have an account?' : 'New to Plaza?'}{' '}
          <button
            type="button"
            onClick={() => setCreating(c => !c)}
            className="font-medium text-plaza-pine hover:underline"
          >
            {creating ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </form>

      <p className="mt-4 text-center text-sm text-plaza-mute">
        <Link to="/" className="hover:underline">Back to the square</Link>
      </p>
    </div>
  )
}

export default Access
