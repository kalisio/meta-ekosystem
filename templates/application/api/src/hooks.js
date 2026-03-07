// Application hooks that run for every service
import * as commonHooks from 'feathers-hooks-common'
import authentication from '@feathersjs/authentication'
import { permissions as kdkCorePermissions, hooks as kdkCoreHooks } from '@kalisio/kdk/core.api.js'
import { defineUserAbilities } from '@kalisio/teams-common'

const { authenticate } = authentication.hooks

kdkCorePermissions.defineAbilities.registerHook(kdkCorePermissions.defineUserAbilities)
kdkCorePermissions.defineAbilities.registerHook(defineUserAbilities)

export default {
  before: {
    all: [kdkCoreHooks.log,
      // We skip authentication in some cases
      commonHooks.when(hook => {
        // First built-in Feathers services like authentication
        if (typeof hook.service.getPath !== 'function') return false
        // Then user creation
        if ((hook.service.name === 'users') && (hook.method === 'create')) return false
        // If not exception perform authentication
        return true
      }, authenticate('jwt')),
      kdkCoreHooks.processObjectIDs,
      kdkCoreHooks.authorise
    ],
    find: [kdkCoreHooks.marshallCollationQuery],
    get: [],
    create: [],
    // We only use pacth in editors to avoid dumping "hidden" (ie internal) properties
    update: [commonHooks.disallow()],
    patch: [],
    remove: []
  },

  after: {
    all: [kdkCoreHooks.log],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [kdkCoreHooks.log],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}
