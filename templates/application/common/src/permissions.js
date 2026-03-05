import _ from 'lodash'

export const Roles = {
  superadmin: 0
  /*
    Setup the list of roles here
  */
}

// Hook to manage app permissions
export function defineUserAbilities (subject, can, cannot, app) {
  if (subject && subject._id) {
    if (subject.permissions) {
      const roles = (Array.isArray(subject.permissions) ? subject.permissions : [subject.permissions])
      roles.forEach(role => {
        // Process app-related roles only
        if (!_.has(Roles, role)) return
        // Map from name to ID
        role = Roles[role]
        /*
          Setup the permissions for each role here
        */
      })
    }
  }
}
