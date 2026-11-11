import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Camera, Eye, KeyRound, Loader2, LogOut, Trash2 } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { usersApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import { PageTitle } from '@/components/klaket/primitives'
import { FormError } from '@/components/klaket/AuthFrame'
import RoleBadge from '@/components/profile/RoleBadge'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function SettingsPage() {
  const { isDarkMode, setDarkMode } = useUIStore()
  const { user, logout, updateRole } = useAuth()
  const qc = useQueryClient()

  const [confirmRole, setConfirmRole] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isFilmmaker = user?.role === 'filmmaker'

  const switchRole = async () => {
    const next = isFilmmaker ? 'viewer' : 'filmmaker'
    try {
      await updateRole.mutateAsync(next)
      if (next === 'viewer') toast.success('You’re a viewer now. Your films stay up; switch back any time to upload.')
    } finally {
      setConfirmRole(false)
    }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await usersApi.deleteMe()
      qc.clear()
      toast.success('Your account and everything in it has been deleted.')
      await logout()
    } catch {
      toast.error('Couldn’t delete your account right now. Try again in a minute.')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 pt-2 pb-8 flex flex-col gap-6">
        <PageTitle en="SETTINGS" ar="الإعدادات" />

        {user && (
          <section className="border-[1.5px] border-foreground bg-card p-3.5 flex items-center gap-3.5">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" />
            <div className="min-w-0 flex flex-col gap-1">
              <b className="text-[16px] truncate">{user.name}</b>
              <span className="text-[13px] text-muted-foreground truncate">{user.email}</span>
              <RoleBadge role={user.role} className="self-start" />
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="k-label text-[11px] font-semibold">Theme</h2>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 border-[1.5px] border-foreground">
            {[
              { dark: false, label: 'Newsprint', note: 'Light', swatch: 'bg-k-paper' },
              { dark: true, label: 'Screening room', note: 'Dark', swatch: 'bg-k-ink' },
            ].map((t, i) => (
              <button
                key={t.label}
                type="button"
                role="radio"
                aria-checked={isDarkMode === t.dark}
                onClick={() => setDarkMode(t.dark)}
                className={cn(
                  'flex items-center gap-3 p-3 text-start min-h-[60px]',
                  i === 0 && 'border-e-[1.5px] border-foreground',
                  isDarkMode === t.dark ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
                )}
              >
                <span className={cn('w-8 h-8 border-[1.5px] border-current shrink-0', t.swatch)} aria-hidden="true" />
                <span className="flex flex-col">
                  <b className="text-[14px]">{t.label}</b>
                  <span className="k-label text-[9.5px] opacity-80">{t.note}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="k-label text-[11px] font-semibold">Your role</h2>
          <div className="border-[1.5px] border-foreground bg-field flex items-center justify-between gap-3 px-3 py-3">
            <span className="flex flex-col">
              <b className="text-[14px] flex items-center gap-2">
                {user && <RoleBadge role={user.role} />}
              </b>
              <span className="text-[13px] text-muted-foreground mt-1">
                {isFilmmaker ? 'You can upload films and enter the vote.' : 'You can watch, vote and leave notes.'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => (isFilmmaker ? setConfirmRole(true) : switchRole())}
              disabled={updateRole.isPending}
              className="press shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3 border-[1.5px] border-foreground k-label text-[10.5px] font-semibold hover:bg-foreground/5 disabled:opacity-60"
            >
              {updateRole.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : isFilmmaker ? <Eye size={14} aria-hidden="true" /> : <Camera size={14} aria-hidden="true" />}
              {isFilmmaker ? 'Switch to viewer' : 'Become a filmmaker'}
            </button>
          </div>
        </section>

        {user?.email && <ChangePassword email={user.email} />}

        <button
          type="button"
          onClick={logout}
          className="press flex items-center justify-center gap-2 min-h-[50px] border-[1.5px] border-foreground font-extrabold text-[14px] hover:bg-foreground/5"
        >
          <LogOut size={16} aria-hidden="true" />
          SIGN OUT
        </button>

        <section className="flex flex-col gap-2" aria-labelledby="danger-zone">
          <h2 id="danger-zone" className="k-label text-[11px] font-semibold text-hot">Danger zone</h2>
          <div className="border-[1.5px] border-hot p-3 flex flex-col gap-2.5">
            <p className="text-[13.5px]">
              Deleting your account removes your profile, films, uploads, notes, votes and crew for good. This can’t be undone.
            </p>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="press self-start inline-flex items-center gap-2 min-h-[44px] px-3 bg-k-red text-k-paper font-extrabold text-[13px] hover:brightness-110"
            >
              <Trash2 size={15} aria-hidden="true" />
              DELETE MY ACCOUNT
            </button>
          </div>
        </section>

        <p className="k-label text-[10px] text-muted-foreground text-center">Klaket v0.1.0 · كلاكيت</p>
      </div>

      {confirmRole && (
        <ConfirmDialog
          title="Switch to viewer?"
          body="Your films stay up and keep their votes, but you won’t be able to upload until you switch back."
          confirm="SWITCH"
          busy={updateRole.isPending}
          onConfirm={switchRole}
          onCancel={() => setConfirmRole(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete your account?"
          body="Your profile, films, uploaded files, notes, votes and crew will be deleted for good. This can’t be undone."
          confirm="DELETE FOREVER"
          requireWord="DELETE"
          busy={deleting}
          onConfirm={deleteAccount}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}

/** Asks for the current password first, so an unlocked device isn't enough to change it. */
function ChangePassword({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setOpen(false)
    setCurrent('')
    setNext('')
    setConfirm('')
    setError('')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (next.length < 6) return setError('Use at least 6 characters for your new password.')
    if (next !== confirm) return setError('The two new passwords don’t match.')
    if (next === current) return setError('Choose a password different from your current one.')
    setSaving(true)
    const check = await supabase.auth.signInWithPassword({ email, password: current })
    if (check.error) {
      setSaving(false)
      return setError('Your current password isn’t right.')
    }
    const { error: err } = await supabase.auth.updateUser({ password: next })
    setSaving(false)
    if (err) return setError(err.message || 'Couldn’t change your password. Try again.')
    toast.success('Password changed.')
    reset()
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="k-label text-[11px] font-semibold">Password</h2>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press flex items-center justify-between gap-3 min-h-[52px] px-3 border-[1.5px] border-foreground bg-field text-start hover:bg-foreground/5"
        >
          <span className="flex items-center gap-2.5">
            <KeyRound size={16} aria-hidden="true" />
            <b className="text-[14px]">Change password</b>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <form onSubmit={save} className="border-[1.5px] border-foreground bg-field p-3 flex flex-col gap-3" noValidate>
          {error && <FormError message={error} />}
          <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <Input label="New password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={next} onChange={(e) => setNext(e.target.value)} required />
          <Input label="Type the new one again" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={reset} disabled={saving} className="press min-h-[46px] border-[1.5px] border-foreground font-extrabold text-[13px] hover:bg-foreground/5">
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving || !current || !next || !confirm}
              className="press min-h-[46px] bg-solid text-solid-foreground font-extrabold text-[13px] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              SAVE
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
