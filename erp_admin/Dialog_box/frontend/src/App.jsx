import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    dateOfBirth: '',
    courseSelection: '',
    currentSemester: 'SEM I',
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSemesterChange = (semester) => {
    setFormData(prev => ({ ...prev, currentSemester: semester }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post('http://localhost:5000/api/students', formData);
      setMessage('Student added successfully!');
      setFormData({
        fullName: '',
        rollNumber: '',
        dateOfBirth: '',
        courseSelection: '',
        currentSemester: 'SEM I'
      });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add the class list to body inside React
  useEffect(() => {
    document.body.className = "font-body bg-surface text-on-surface";
  }, []);

  return (
    <>
      {/* Background Dashboard (Dimmed) */}
      <div className="fixed inset-0 flex overflow-hidden opacity-40 grayscale-[0.5] pointer-events-none">
        {/* SideNavBar */}
        <aside className="h-screen w-64 bg-surface-container-low flex flex-col py-6 z-40">
          <div className="px-8 mb-10">
            <h1 className="text-lg font-black text-primary">Admin Portal</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Central Management</p>
          </div>
          <nav className="flex-1 space-y-1">
            <div className="flex items-center gap-3 bg-white text-primary rounded-l-full ml-4 pl-4 py-3 border-r-4 border-primary transition-transform duration-300 translate-x-1">
              <span className="material-symbols-outlined">school</span>
              <span className="text-xs uppercase tracking-widest font-bold">Students</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 px-8 py-3">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-xs uppercase tracking-widest font-bold">Dashboard</span>
            </div>
          </nav>
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 flex flex-col h-screen">
          <header className="w-full bg-gradient-to-r from-primary to-primary-container text-white flex justify-between items-center px-8 py-3 sticky top-0 z-50">
            <div className="text-2xl font-bold tracking-tight">Academic Luminary</div>
            <div className="flex gap-4">
              <span className="material-symbols-outlined">notifications</span>
              <span className="material-symbols-outlined">settings</span>
            </div>
          </header>
          <div className="p-12 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-1">Overview</p>
                <h2 className="font-headline text-5xl font-extrabold text-primary tracking-tight">Student Directory</h2>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 bg-surface-container-lowest h-96 rounded-xl"></div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-[100] bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Multi-Step Dialog */}
        <div className="bg-surface-container-lowest w-full max-w-4xl rounded-xl shadow-[0_0_32px_rgba(25,28,30,0.06)] overflow-hidden flex flex-col md:flex-row h-[921px] md:h-auto">
          
          {/* Sidebar Navigation (Steps) */}
          <div className="w-full md:w-64 bg-surface-container-low p-8 border-r border-outline-variant/15 flex flex-col gap-8">
            <div>
              <h3 className="font-headline text-xl font-bold text-primary mb-1">New Enrollment</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">Fill in the required academic and personal records to register a new student.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-primary group">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-xs uppercase tracking-widest font-bold">Personal Details</span>
              </div>
              <div className="flex items-center gap-4 text-outline group">
                <div className="w-8 h-8 rounded-full border-2 border-outline-variant flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-xs uppercase tracking-widest font-bold">Academic Info</span>
              </div>
              <div className="flex items-center gap-4 text-outline group">
                <div className="w-8 h-8 rounded-full border-2 border-outline-variant flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-xs uppercase tracking-widest font-bold">Documents</span>
              </div>
            </div>

            <div className="mt-auto hidden md:block pt-8">
              <div className="p-4 bg-primary-fixed rounded-lg">
                <p className="text-[10px] font-bold text-on-primary-fixed-variant uppercase tracking-wider mb-2">Pro Tip</p>
                <p className="text-[11px] text-on-primary-fixed leading-normal">Ensure the profile image is high resolution for institutional ID cards.</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              {message && (
                <div className="mb-6 p-4 rounded-lg bg-secondary-container text-on-secondary-container text-sm font-bold text-center">
                  {message}
                </div>
              )}
              
              <section className="space-y-10">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                  
                  {/* Profile Picture Upload Area */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-surface-container-high ring-4 ring-surface-container flex items-center justify-center">
                        <img alt="Student Preview" className="w-full h-full object-cover opacity-80" data-alt="professional studio portrait placeholder of a generic human silhouette on a neutral grey academic background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhRLY8iLkZVrZF_rS4v_Ybf13elfrklCnfElm2co9q8384PQWQcCj5xXaUFz61ySKVAKdgNg7S2Sb-Kbb22SOndhIOfO0Ml1tC7V7Mc6bqEMGy-XL9E44Ak0EzuuTIg3c5mLPWD-pUKT3-rIj5XBuJpkMp8xeCH1P5BjfpFDWWIL680q4rPUVSzPnNxZcXXIen5E1xC27zt3MiuVaWnMDBA_fTJYiFpAw_X6vrPtPYJIlP4strwzoqdW7ayy7NQ5RnsYp-jWA-8aIW"/>
                        <div className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white">photo_camera</span>
                        </div>
                      </div>
                      <button type="button" className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-full shadow-lg">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Upload Photo</span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Legal Name</label>
                      <input 
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full border-b border-outline-variant/30 bg-transparent py-2 focus:border-primary focus:ring-0 transition-colors text-on-surface placeholder:text-outline-variant font-medium outline-none" 
                        placeholder="e.g. Alexander Hamilton" 
                        type="text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Roll Number</label>
                      <input 
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full border-b border-outline-variant/30 bg-transparent py-2 focus:border-primary focus:ring-0 transition-colors text-on-surface placeholder:text-outline-variant font-medium outline-none" 
                        placeholder="2024-ARCH-012" 
                        type="text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Date of Birth</label>
                      <input 
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="w-full border-b border-outline-variant/30 bg-transparent py-2 focus:border-primary focus:ring-0 transition-colors text-on-surface font-medium outline-none" 
                        type="date"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Info Row */}
                <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Course Selection</label>
                    <div className="relative">
                      <select 
                        name="courseSelection"
                        value={formData.courseSelection}
                        onChange={handleInputChange}
                        required
                        className="w-full border-b border-outline-variant/30 bg-transparent py-2 focus:border-primary focus:ring-0 transition-colors text-on-surface font-medium appearance-none outline-none"
                      >
                        <option value="">Select Program...</option>
                        <option value="B.Sc. Architecture & Design">B.Sc. Architecture & Design</option>
                        <option value="M.A. Historical Economics">M.A. Historical Economics</option>
                        <option value="B.Eng. Digital Civil Systems">B.Eng. Digital Civil Systems</option>
                        <option value="Ph.D. Applied Ethics">Ph.D. Applied Ethics</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-0 top-2 text-outline-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Current Semester</label>
                    <div className="flex gap-2 pt-2">
                      {['SEM I', 'SEM II', 'SEM III'].map(sem => (
                        <button 
                          key={sem}
                          type="button"
                          onClick={() => handleSemesterChange(sem)}
                          className={`flex-1 py-2 text-xs font-bold border border-outline-variant/30 rounded transition-colors ${
                            formData.currentSemester === sem 
                            ? 'bg-primary text-white' 
                            : 'hover:bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {sem}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-4 pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Required Documents</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border-2 border-dashed border-outline-variant/30 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-colors group cursor-pointer text-on-surface">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary">upload_file</span>
                      <span className="text-[10px] font-bold text-center">Previous Transcript</span>
                    </div>
                    <div className="border-2 border-dashed border-outline-variant/30 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-colors group cursor-pointer text-on-surface">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary">badge</span>
                      <span className="text-[10px] font-bold text-center">ID Proof</span>
                    </div>
                    <div className="border-2 border-dashed border-outline-variant/30 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-colors group cursor-pointer text-on-surface">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary">medical_services</span>
                      <span className="text-[10px] font-bold text-center">Medical Certificate</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            
            {/* Footer Actions */}
            <div className="p-8 bg-surface-container-low flex justify-between items-center border-t border-outline-variant/15">
              <button type="button" className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
              <div className="flex gap-4">
                <button type="button" disabled={loading} className="px-8 py-3 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 opacity-70">
                    Save Draft
                </button>
                <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[0.98] duration-200 transition-all flex items-center gap-2">
                    {loading ? 'Processing...' : 'Submit Form'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </form>

          {/* Close Button (Absolute) */}
          <button className="absolute top-4 right-4 text-white md:text-on-surface-variant hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
