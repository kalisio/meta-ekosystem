import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Roles, defineUserAbilities } from '../src/permissions.js'

describe('Roles', () => {
  it('should contain superadmin with value 0', () => {
    expect(Roles.superadmin).toBe(0)
  })

  it('should not contain undefined roles', () => {
    expect(Roles).not.toHaveProperty('admin')
    expect(Roles).not.toHaveProperty('user')
  })
})

describe('defineUserAbilities', () => {
  let can, cannot

  beforeEach(() => {
    can = vi.fn()
    cannot = vi.fn()
  })

  it('should do nothing if subject is undefined', () => {
    defineUserAbilities(undefined, can, cannot)
    expect(can).not.toHaveBeenCalled()
    expect(cannot).not.toHaveBeenCalled()
  })

  it('should do nothing if subject is null', () => {
    defineUserAbilities(null, can, cannot)
    expect(can).not.toHaveBeenCalled()
    expect(cannot).not.toHaveBeenCalled()
  })

  it('should do nothing if subject has no _id', () => {
    defineUserAbilities({ permissions: ['superadmin'] }, can, cannot)
    expect(can).not.toHaveBeenCalled()
    expect(cannot).not.toHaveBeenCalled()
  })

  it('should do nothing if subject has no permissions', () => {
    defineUserAbilities({ _id: '123' }, can, cannot)
    expect(can).not.toHaveBeenCalled()
    expect(cannot).not.toHaveBeenCalled()
  })

  it('should ignore an unknown role', () => {
    defineUserAbilities({ _id: '123', permissions: ['unknown_role'] }, can, cannot)
    expect(can).not.toHaveBeenCalled()
    expect(cannot).not.toHaveBeenCalled()
  })

  it('should accept permissions as a string', () => {
    expect(() => {
      defineUserAbilities({ _id: '123', permissions: 'superadmin' }, can, cannot)
    }).not.toThrow()
  })

  it('should accept permissions as an array', () => {
    expect(() => {
      defineUserAbilities({ _id: '123', permissions: ['superadmin'] }, can, cannot)
    }).not.toThrow()
  })

  it('should process multiple roles and skip unknown ones', () => {
    expect(() => {
      defineUserAbilities({ _id: '123', permissions: ['superadmin', 'unknown'] }, can, cannot)
    }).not.toThrow()
  })
})
