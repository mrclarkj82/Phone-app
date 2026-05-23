import PrivateHeader from "../components/PrivateHeader";
import useAssignmentDashboard from "../hooks/useAssignmentDashboard";

export default function TeacherDashboard() {
  useAssignmentDashboard();

  return (
    <>
      <PrivateHeader eyebrow="Algebra I" title="Teacher Dashboard">
        <div className="header-stats" aria-label="Assignment summary">
          <span>
            <strong id="header-problem-count">30</strong> problems
          </span>
          <span>
            <strong id="header-student-count">24</strong> students
          </span>
        </div>
      </PrivateHeader>

      <main className="app-shell">
        <section aria-labelledby="teacher-heading">
          <div className="dashboard-grid">
            <section className="dashboard-summary" aria-label="Class summary">
              <div>
                <p className="eyebrow">Teacher</p>
                <h2 id="teacher-heading">Class Dashboard</h2>
              </div>
              <div className="dashboard-controls">
                <label htmlFor="dashboard-assignment-select">Assignment</label>
                <select id="dashboard-assignment-select" />
              </div>
              <div className="summary-metrics">
                <div>
                  <span>Submitted</span>
                  <strong id="submitted-count">0 / 24</strong>
                </div>
                <div>
                  <span>Class Average</span>
                  <strong id="class-average">--</strong>
                </div>
                <div>
                  <span>Highest</span>
                  <strong id="highest-score">--</strong>
                </div>
              </div>
              <p className="dashboard-sync-status" id="dashboard-sync-status" aria-live="polite" />
            </section>

            <section className="dashboard-table-wrap" aria-label="Submitted grades">
              <div className="table-actions">
                <h3>Roster</h3>
                <div className="table-buttons">
                  <button className="secondary-button" id="refresh-dashboard" type="button">
                    Refresh
                  </button>
                  <button className="secondary-button" id="reset-dashboard" type="button">
                    Clear All Submissions
                  </button>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Status</th>
                      <th scope="col">Score</th>
                      <th scope="col">Grade</th>
                      <th scope="col">Answered</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">Reset</th>
                    </tr>
                  </thead>
                  <tbody id="dashboard-body" />
                </table>
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
