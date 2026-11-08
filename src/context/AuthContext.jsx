import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileFor, setProfileFor] = useState(null) // профайлыг нь ачаалж дууссан хэрэглэгчийн id
  const [loading, setLoading] = useState(true)       // анхны session шалгалт

  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); setProfileFor(null); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data ?? null)
    setProfileFor(uid)
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      if (active) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'TOKEN_REFRESHED') return
      // onAuthStateChange доторх supabase дуудлагыг setTimeout-оор хойшлуулдаг (deadlock-оос сэргийлнэ)
      setTimeout(() => loadProfile(s?.user?.id), 0)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [loadProfile])

  const user = session?.user ?? null
  const value = useMemo(() => ({
    session,
    user,
    profile,
    isAdmin: Boolean(profile?.is_admin),
    loading,
    profileReady: !user || profileFor === user.id,   // эрх шалгахаас өмнө профайл ачаалагдсан эсэх
    refreshProfile: () => loadProfile(user?.id),
    signOut: () => supabase.auth.signOut(),
  }), [session, user, profile, profileFor, loading, loadProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
