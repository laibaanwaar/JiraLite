function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration)
  })
}

export async function getRoles() {
  await wait(700)

  return {
    roles: [],
    totalCount: 0,
  }
}

export async function createRole(rolePayload) {
  await wait(300)

  return {
    message: 'Role creation is not connected to the API yet.',
    data: rolePayload,
  }
}

export async function updateRole(roleId, rolePayload) {
  await wait(300)

  return {
    message: 'Role updates are not connected to the API yet.',
    id: roleId,
    data: rolePayload,
  }
}

export async function deactivateRole(roleId) {
  await wait(300)

  return {
    message: 'Role deactivation is not connected to the API yet.',
    id: roleId,
  }
}
