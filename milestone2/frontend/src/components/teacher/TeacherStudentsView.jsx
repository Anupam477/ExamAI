import React, { useState } from 'react';
import { getStoredUsers } from '../../utils/mockApi';

/**
 * Teacher Students Roster View
 * Allows teachers to inspect enrolled candidates, departments, and verification credentials
 */
export default function TeacherStudentsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const students = getStoredUsers().filter((u) => u.role === 'student' && u.active);

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.identifier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', color: 'var(--tp-text-primary)' }}>
            Enrolled Students Roster
          </h2>
          <p style={{ margin: 0, fontSize: '0.84375rem', color: 'var(--tp-text-muted)' }}>
            Institutional student database approved for online examination testing.
          </p>
        </div>

        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="teacher-input"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="teacher-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--tp-surface-hover)', borderBottom: '1px solid var(--tp-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>CANDIDATE</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>ROLL NUMBER</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>COLLEGE / ACADEMY</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>DEPARTMENT</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>PROCTOR STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--tp-border-light)' }}>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: s.avatarColor || '#2563EB',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {s.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--tp-text-primary)' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--tp-text-secondary)' }}>
                    {s.identifier}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-secondary)' }}>
                    {s.college}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>
                    {s.department}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: s.status === 'approved' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                        color: s.status === 'approved' ? '#16A34A' : '#CA8A04',
                      }}
                    >
                      {s.status === 'approved' ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
