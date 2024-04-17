import type { User } from "$lib/types"
import { getContext, setContext } from "svelte"

class CurrentUser {
  user  = $state({})

  constructor(initialUser: User) {
    this.user = initialUser
  }
}

export function setCurrentUser(user: User) {
  const currentUser = new CurrentUser(user)
  setContext('USER_CTX', currentUser)
  return currentUser
}

export function getCurrentUser() {
  return getContext<CurrentUser>('USER_CTX')
}
