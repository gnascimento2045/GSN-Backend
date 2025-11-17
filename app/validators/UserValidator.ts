import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100),
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string()
      .minLength(8)
      .maxLength(100)
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100).optional(),
    email: vine.string().trim().email().normalizeEmail().optional(),
    password: vine.string()
      .minLength(8)
      .maxLength(100)
      .optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
  })
)
