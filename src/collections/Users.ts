import type { Access, CollectionConfig } from 'payload'

const isAppUser: Access = ({ req }) => req.user?.collection === 'users'
const isSelf: Access = ({ req }) => {
  if (req.user?.collection !== 'users') return false
  return { id: { equals: req.user.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'Campus Life',
    useAsTitle: 'name',
  },
  access: {
    admin: () => false,
    create: () => true,
    delete: isSelf,
    read: isAppUser,
    update: isSelf,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 80,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'student',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Tutor', value: 'tutor' },
      ],
      access: {
        create: () => false,
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'year',
      type: 'text',
      maxLength: 30,
    },
  ],
  versions: false,
}
