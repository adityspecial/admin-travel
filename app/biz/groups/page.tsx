'use client'
import './groups.css'

export default function GroupsPage() {
  return (
    <div className="groups-page">
      <div className="groups-header">
        <div className="groups-breadcrumb">Company &amp; Employees &rsaquo; Groups</div>
        <h1 className="groups-title">Groups</h1>
      </div>

      <div className="groups-empty-card">
        <div className="groups-empty-icon">👥</div>
        <div className="groups-empty-title">Groups — Coming Soon</div>
        <div className="groups-empty-desc">
          Create employee groups (e.g. Engineering, Sales) to apply different travel policies and budget caps per team.
        </div>
      </div>
    </div>
  )
}
