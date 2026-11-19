import type { Access, CollectionConfig, Where } from 'payload'

const eventScope: Access = ({ req }) => {
  if (req.user?.collection !== 'users') return false
  const scope: Where = {
    or: [{ owner: { equals: req.user.id } }, { attendees: { contains: req.user.id } }],
  }
  return scope
}

export const CalendarEvents: CollectionConfig = {
  slug: 'calendar-events',
  admin: {
    group: 'Campus Life',
    useAsTitle: 'title',
    defaultColumns: ['title', 'start', 'type', 'source'],
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) =>
      req.user?.collection === 'users' ? { owner: { equals: req.user.id } } : false,
    read: eventScope,
    update: ({ req }) =>
      req.user?.collection === 'users' ? { owner: { equals: req.user.id } } : false,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (req.user?.collection !== 'users') return data
        if (operation === 'create') data.owner = req.user.id
        if (req.user.role !== 'tutor') data.attendees = []
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 140 },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'personal',
      options: [
        { label: 'Personal', value: 'personal' },
        { label: 'Assignment', value: 'assignment' },
        { label: 'Tutor meeting', value: 'tutoring' },
        { label: 'Study session', value: 'study' },
      ],
    },
    { name: 'start', type: 'date', required: true, index: true },
    { name: 'end', type: 'date' },
    { name: 'allDay', type: 'checkbox', defaultValue: false },
    { name: 'location', type: 'text', maxLength: 120 },
    { name: 'notes', type: 'textarea', maxLength: 1200 },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: 'attendees',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'campus-life',
      options: [
        { label: 'Campus Life', value: 'campus-life' },
        { label: 'Brightspace import', value: 'brightspace' },
      ],
      access: { create: () => false, update: () => false },
    },
    {
      name: 'externalId',
      type: 'text',
      index: true,
      maxLength: 220,
      access: { create: () => false, update: () => false },
    },
  ],
  versions: false,
}
