import type { Access, FieldAccess } from 'payload'
export const staff: Access = ({ req }) => ['admin', 'editor'].includes(String(req.user?.role))
export const admin: Access = ({ req }) => req.user?.role === 'admin'
export const adminField: FieldAccess = ({ req }) => req.user?.role === 'admin'
export const contentAccess = { read: staff, create: staff, update: staff, delete: () => false, readVersions: staff }
