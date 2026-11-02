import React, { useState, useMemo } from 'react';
import { getStoredUsers } from '../../utils/mockApi';

/**
 * Step 3: Assign Students
 * Roster selector to assign candidates to the examination
 */
export default function StepAssignStudents({ formData, onChange, onNext, onBack, onDirectPublish }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Load registered students
  const allStudents = useMemo(() => {
    const users = getStoredUsers();
    return users.filter((u) => u.role === 'student' && u.active);
  }, []);

  const assigned = formData.assignedStudents || [];

  const filteredStudents = useMemo(() => {
    return allStudents.filter((st) => {
      const matchSearch =
        st.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.identifier?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === 'all' || st.department?.toLowerCase() === deptFilter.toLowerCase();
      return matchSearch && matchDept;
    });
  }, [allStudents, searchTerm, deptFilter]);

  const handleToggleStudent = (studentId) => {
    if (assigned.includes(studentId)) {
      onChange({
        ...formData,
        assignedStudents: assigned.filter((id) => id !== studentId),
      });
    } else {
      onChange({
        ...formData,
        assignedStudents: [...assigned, studentId],
      });
    }
  };

  const handleSelectAll = () => {
    if (assigned.length === allStudents.length) {
      onChange({ ...formData, assignedStudents: [] });
    } else {
      onChange({ ...formData, assignedStudents: allStudents.map((s) => s.id) });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Filter and Search Bar */}
      <div className="teacher-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--tp-text-primary)' }}>
              Assign Candidates to Examination
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--tp-text-muted)' }}>
              Selected <strong style={{ color: 'var(--tp-green-primary)' }}>{assigned.length}</strong> of {allStudents.length} enrolled candidates
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="teacher-btn-secondary"
              onClick={handleSelectAll}
            >
              {assigned.length === allStudents.length ? 'Deselect All' : 'Select All Eligible'}
            </button>
          </div>
        </div>

        {/* Search & Department Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="teacher-input"
              placeholder="Search candidate by name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select
              className="teacher-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Electrical Eng">Electrical Eng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Roster List */}
      <div className="teacher-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--tp-surface-hover)', borderBottom: '1px solid var(--tp-border)' }}>
                <th style={{ padding: '0.75rem 1rem', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={assigned.length > 0 && assigned.length === allStudents.length}
                    onChange={handleSelectAll}
                    style={{ accentColor: 'var(--tp-green-primary)' }}
                  />
                </th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--tp-text-muted)', fontWeight: 600 }}>CANDIDATE</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--tp-text-muted)', fontWeight: 600 }}>ROLL NUMBER</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--tp-text-muted)', fontWeight: 600 }}>INSTITUTION &amp; CLASS</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--tp-text-muted)', fontWeight: 600 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--tp-text-muted)' }}>
                    No matching students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const isChecked = assigned.includes(st.id);
                  return (
                    <tr
                      key={st.id}
                      onClick={() => handleToggleStudent(st.id)}
                      style={{
                        borderBottom: '1px solid var(--tp-border-light)',
                        backgroundColor: isChecked ? 'var(--tp-green-light)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 140ms ease',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(st.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ accentColor: 'var(--tp-green-primary)' }}
                        />
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: st.avatarColor || '#2563EB',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {st.name?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--tp-text-primary)' }}>
                              {st.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>
                              {st.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--tp-text-secondary)' }}>
                        {st.identifier || 'ROLL-PENDING'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ color: 'var(--tp-text-primary)' }}>{st.college}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--tp-text-muted)' }}>
                          {st.subDetails || st.department}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: st.status === 'approved' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                            color: st.status === 'approved' ? '#16A34A' : '#CA8A04',
                          }}
                        >
                          {st.status?.toUpperCase() || 'APPROVED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '10px' }}>
        <button type="button" className="teacher-btn-secondary" onClick={onBack}>
          &larr; Back to Questions
        </button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onDirectPublish && (
            <button
              type="button"
              className="teacher-btn-primary"
              style={{
                width: 'auto',
                backgroundColor: '#16A34A',
                borderColor: '#16A34A',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
              }}
              onClick={() => onDirectPublish({ ...formData, status: 'published' })}
              title="Publish and assign immediately to all students"
            >
              <span>Assign &amp; Publish Test Now</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>↗</span>
            </button>
          )}

          <button
            type="button"
            className="teacher-btn-primary"
            style={{ width: 'auto' }}
            onClick={onNext}
          >
            Review &amp; Publish Exam ({assigned.length} Enrolled) &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
