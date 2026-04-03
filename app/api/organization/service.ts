import prisma from '../../../lib/prisma'
import type { CreateOrganizationInput } from './validator'

export async function listOrganizations() {
  return prisma.organization.findMany()
}

export async function getOrganizationById(id: number) {
  return prisma.organization.findUnique({
    where: { id },
  })
}

export async function createOrganization(input: CreateOrganizationInput) {
  return prisma.organization.create({
    data: {
      name: input.name,
      address: input.address,
      city: input.city,
      zip: input.zip,
      phone: input.phone,
      email: input.email,
    },
  })
}
