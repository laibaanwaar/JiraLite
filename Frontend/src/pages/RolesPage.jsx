import { useState } from 'react'

import AppShell from '../components/AppShell'
import CreateRoleButton from '../components/CreateRoleButton'
import RoleCard from '../components/RoleCard'
import RoleSearch from '../components/RoleSearch'
import RoleTable from '../components/RoleTable'
import CreateRoleForm from './CreateRoleForm'

function RolesPage() {
  const [isCreateRoleFormOpen, setIsCreateRoleFormOpen] = useState(false)

  return (
    <AppShell>
      <section className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="min-h-[calc(100vh-8rem)] rounded-[28px] border border-slate-200 bg-[#f8faff] px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[2rem] font-black tracking-tight text-slate-900">Role Management</h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                  Create, manage, and control user roles and permissions across the workspace.
                </p>
              </div>

              <CreateRoleButton onClick={() => setIsCreateRoleFormOpen(true)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <RoleCard
                title="Total Roles"
                tone="blue"
                icon={<ShieldIcon />}
              />
              <RoleCard
                title="Active Roles"
                tone="violet"
                icon={<ActiveIcon />}
              />
              <RoleCard
                title="Inactive Roles"
                tone="slate"
                icon={<InactiveIcon />}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
              <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                <RoleSearch value="" onChange={() => {}} />
              </div>

              <RoleTable />
            </div>
          </div>
        </div>
      </section>

      <CreateRoleForm
        isOpen={isCreateRoleFormOpen}
        onClose={() => setIsCreateRoleFormOpen(false)}
      />
    </AppShell>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 2.5 4.5 4.7v4.66c0 3.2 2.05 6.03 5.1 7.05L10 16.5l.4-.09c3.05-1.02 5.1-3.84 5.1-7.05V4.7L10 2.5Z" />
    </svg>
  )
}

function ActiveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="10" r="6.5" />
      <path d="m7.4 10.3 1.7 1.7 3.5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InactiveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="10" r="6.5" />
      <path d="m7.7 7.7 4.6 4.6M12.3 7.7l-4.6 4.6" strokeLinecap="round" />
    </svg>
  )
}

export default RolesPage
