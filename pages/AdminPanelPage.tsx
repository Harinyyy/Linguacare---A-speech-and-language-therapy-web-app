import React, { useState, useMemo, useEffect } from 'react';
import type { User, UserRole, ExerciseResult, AdminFeedback, UserFeedback } from '../types';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { Modal } from '../components/Modal';
import { 
    UsersIcon, PencilIcon, TrashIcon, KeyIcon,
    ChartBarIcon, BookOpenIcon, QuestionMarkCircleIcon, SettingsIcon,
    WarningIcon, InfoCircleIcon, XCircleIcon, CheckCircleIcon,
    AdminShieldIcon, PlusCircleIcon, AnnotationIcon
} from '../components/Icons';

const today = new Date();
const getDate = (daysAgo: number) => new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

const INITIAL_MOCK_USERS: User[] = [
    { name: 'Patient', role: 'user', email: 'patient@linguacare.com', signupDate: getDate(5) },
    { name: 'Admin', role: 'admin', email: 'admin@linguacare.com', signupDate: getDate(40) },
    { name: 'Jane Doe', role: 'user', email: 'jane.doe@example.com', signupDate: getDate(1) },
    { name: 'John Smith', role: 'user', email: 'john.smith@example.com', signupDate: getDate(15) },
    { name: 'Emily White', role: 'user', email: 'emily.white@example.com', signupDate: getDate(35) },
];

type ModalType = 
    | 'editUser' 
    | 'resetPassword' 
    | 'removeUser' 
    | 'uploadMaterials'
    | 'updateAnnouncements'
    | 'viewQueries'
    | 'accessFeedback'
    | 'changePassword'
    | 'configureSettings'
    | 'manageRoles'
    | 'rejectSession'
    | 'info'
    | 'error'
    | 'addUser'
    | 'postAnnouncement';

interface ModalState {
    type: ModalType;
    data?: any;
    title: string;
}

export const AdminPanelPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>(INITIAL_MOCK_USERS);
    const [sessions, setSessions] = useState<ExerciseResult[]>([]);
    const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
    const [roleFilter, setRoleFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [modalState, setModalState] = useState<ModalState | null>(null);
    const [modalInputValue, setModalInputValue] = useState('');
    const [modalInputEmail, setModalInputEmail] = useState('');
    
    const { playClick, playSuccess, playError } = useSoundEffects();

    useEffect(() => {
        try {
            const historyJson = localStorage.getItem('linguacare_exercise_history');
            if (historyJson) {
                setSessions(JSON.parse(historyJson));
            } else {
                 const mockSessions: ExerciseResult[] = [
                    { id: 'session1', phrase: "The quick brown fox jumps over the lazy dog", score: 85, date: getDate(1), userEmail: 'jane.doe@example.com', feedback: { overallScore: 85, summary: 'Good job!', wordAnalysis: [] }, status: 'pending' },
                    { id: 'session2', phrase: "She sells seashells by the seashore", score: 62, date: getDate(2), userEmail: 'john.smith@example.com', feedback: { overallScore: 62, summary: 'Focus on the SH sound.', wordAnalysis: [] }, status: 'pending' },
                ];
                setSessions(mockSessions);
                localStorage.setItem('linguacare_exercise_history', JSON.stringify(mockSessions));
            }

            const feedbackJson = localStorage.getItem('linguacare_user_feedback');
            if (feedbackJson) {
                setUserFeedback(JSON.parse(feedbackJson));
            }
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        }
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const roleMatch = roleFilter === 'all' || user.role === roleFilter;
            if (!roleMatch) return false;

            if (dateFilter === 'all') return true;

            const signupDate = user.signupDate ? new Date(user.signupDate) : null;
            if (!signupDate) return dateFilter === 'all';
            
            const now = new Date();
            const daysToSubtract = dateFilter === '7days' ? 7 : 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(now.getDate() - daysToSubtract);

            return signupDate >= cutoffDate;
        });
    }, [users, roleFilter, dateFilter]);

    const closeModal = () => { setModalState(null); setModalInputValue(''); setModalInputEmail(''); };

    const handleEditUser = (user: User) => {
        playClick();
        setModalInputValue(user.name);
        setModalState({ type: 'editUser', data: user, title: `Edit ${user.name}` });
    };
    const confirmEditUser = () => {
        const newName = modalInputValue.trim();
        const user = modalState?.data as User;
        if (newName && user) {
            setUsers(users.map(u => u.email === user.email ? { ...u, name: newName } : u));
            playSuccess();
            setModalState({ type: 'info', title: 'Success', data: { message: `User ${user.email} has been updated.` } });
        } else {
            playError();
            setModalState({ type: 'error', title: 'Invalid Name', data: { message: 'User name cannot be empty.' } });
        }
    };
    
    const handleRemoveUser = (user: User) => {
        playClick();
        setModalState({ type: 'removeUser', data: user, title: `Remove ${user.name}` });
    };
    const confirmRemoveUser = () => {
        const userToRemove = modalState?.data as User;
        setUsers(users.filter(u => u.email !== userToRemove.email));
        playSuccess();
        setModalState({ type: 'info', title: 'User Removed', data: { message: `User ${userToRemove.email} has been removed.` } });
    };

    const handleResetPassword = (user: User) => {
        playClick();
        setModalState({ type: 'resetPassword', data: user, title: `Reset Password for ${user.name}` });
    };
    const confirmResetPassword = () => {
        const user = modalState?.data as User;
        playSuccess();
        setModalState({ type: 'info', title: 'Password Reset', data: { message: `A password reset link has been sent to ${user.email} (simulated).` } });
    };

    const handleApproveSession = (sessionId: string) => {
        playClick();
        const updatedSessions = sessions.map(s => s.id === sessionId ? { ...s, status: 'approved' as const } : s);
        setSessions(updatedSessions);
        try {
            localStorage.setItem('linguacare_exercise_history', JSON.stringify(updatedSessions));
            playSuccess();
        } catch (e) {
            console.error("Failed to update session status in localStorage", e);
            playError();
        }
    };

    const handleRejectSession = (session: ExerciseResult) => {
        playClick();
        setModalState({ type: 'rejectSession', data: session, title: `Reject Session` });
    };
    
    const confirmRejectSession = () => {
        const session = modalState?.data as ExerciseResult;
        const reason = modalInputValue.trim();
        if (!reason) {
            playError();
            setModalState({ type: 'error', title: 'Reason Required', data: { message: 'Please provide a reason for rejection.' } });
            return;
        }

        const updatedSessions = sessions.map(s => s.id === session.id ? { ...s, status: 'rejected' as const, rejectionReason: reason } : s);
        setSessions(updatedSessions);
        
        try {
            localStorage.setItem('linguacare_exercise_history', JSON.stringify(updatedSessions));
            
            const FEEDBACK_KEY = 'linguacare_admin_feedback';
            const feedbackJson = localStorage.getItem(FEEDBACK_KEY);
            const allFeedback: AdminFeedback[] = feedbackJson ? JSON.parse(feedbackJson) : [];
            const newFeedback: AdminFeedback = {
                id: crypto.randomUUID(),
                userEmail: session.userEmail,
                message: `Your practice session for "${session.phrase}" was rejected. Reason: ${reason}`,
                date: new Date().toISOString(),
                read: false,
                context: { phrase: session.phrase }
            };
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify([newFeedback, ...allFeedback]));
            playSuccess();
            setModalState({ type: 'info', title: 'Session Rejected', data: { message: `The session has been marked as rejected and the user has been notified.` } });
        } catch(e) { 
            console.error("Failed to save rejection feedback or sessions", e);
            playError();
            setModalState({ type: 'error', title: 'Save Error', data: { message: 'Could not save the changes.' } });
        }
    };
    
    const handleMockAction = (type: ModalType, title: string, message?: string) => {
        playClick();
        if (['updateAnnouncements', 'addUser', 'postAnnouncement'].includes(type)) {
            setModalState({ type, title });
        } else {
            setModalState({ type: 'info', title, data: { message } });
        }
    };

    const confirmAddUser = () => {
        const name = modalInputValue.trim();
        const email = modalInputEmail.trim();
        if (name && email) {
            const newUser: User = { name, email, role: 'user', signupDate: new Date().toISOString() };
            setUsers(prev => [newUser, ...prev]);
            playSuccess();
            setModalState({ type: 'info', title: 'Success', data: { message: `User ${email} has been created.` } });
        } else {
            playError();
            setModalState({ type: 'error', title: 'Invalid Input', data: { message: 'Name and email cannot be empty.' } });
        }
    };
    
    const confirmPostAnnouncement = () => {
        const announcement = modalInputValue.trim();
        if (announcement) {
            playSuccess();
            setModalState({ type: 'info', title: 'Success', data: { message: `Announcement posted: "${announcement}"` } });
        } else {
            playError();
            setModalState({ type: 'error', title: 'Invalid Input', data: { message: 'Announcement cannot be empty.' } });
        }
    };

    const handleFeedbackStatusChange = (feedbackId: string, newStatus: UserFeedback['status']) => {
        const updatedFeedback = userFeedback.map(fb => fb.id === feedbackId ? { ...fb, status: newStatus } : fb);
        setUserFeedback(updatedFeedback);
        localStorage.setItem('linguacare_user_feedback', JSON.stringify(updatedFeedback));
        playClick();
    };

    const handleDeleteFeedback = (feedbackId: string) => {
        const updatedFeedback = userFeedback.filter(fb => fb.id !== feedbackId);
        setUserFeedback(updatedFeedback);
        localStorage.setItem('linguacare_user_feedback', JSON.stringify(updatedFeedback));
        playSuccess();
    };

    const getStatusChip = (status: 'pending' | 'approved' | 'rejected' | 'new' | 'viewed' | 'resolved') => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            new: 'bg-blue-100 text-blue-800',
            viewed: 'bg-indigo-100 text-indigo-800',
            resolved: 'bg-gray-100 text-gray-800',
        };
        const currentStatus = status || 'pending';
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[currentStatus]}`}>{currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</span>;
    };
    
  return (
    <>
    <div className="animate-fade-in space-y-8">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage users, review sessions, and oversee the platform.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <main className="lg:col-span-2 space-y-8">
                {/* User Management */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><UsersIcon /> User Management</h2>
                        <button onClick={() => handleMockAction('addUser', 'Add New User')} className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-teal-700 text-sm"><PlusCircleIcon className="h-5 w-5"/> Add User</button>
                    </div>
                    <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-slate-200">
                         <div className="flex-1 min-w-[150px]">
                            <label htmlFor="role-filter" className="block text-sm font-medium text-slate-600 mb-1">Filter by Role</label>
                            <select id="role-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option value="all">All Roles</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label htmlFor="date-filter" className="block text-sm font-medium text-slate-600 mb-1">Filter by Signup Date</label>
                            <select id="date-filter" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option value="all">All Time</option>
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Signup Date</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredUsers.map(user => (
                                    <tr key={user.email}>
                                        <td className="px-4 py-4 whitespace-nowrap"><div className="text-sm font-medium text-slate-900">{user.name}</div><div className="text-sm text-slate-500">{user.email}</div></td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{user.role}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{user.signupDate ? new Date(user.signupDate).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEditUser(user)} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-md" aria-label={`Edit user ${user.name}`}><PencilIcon /></button>
                                                <button onClick={() => handleResetPassword(user)} className="p-2 text-slate-500 hover:text-yellow-600 hover:bg-slate-100 rounded-md" aria-label={`Reset password for ${user.name}`}><KeyIcon /></button>
                                                <button onClick={() => handleRemoveUser(user)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-md" aria-label={`Remove user ${user.name}`}><TrashIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Session Management */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><ChartBarIcon /> Session Management & Feedback</h2>
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                        {sessions.length > 0 ? sessions.map(session => (
                            <div key={session.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div>
                                        <p className="font-semibold text-slate-800">"{session.phrase}"</p>
                                        <p className="text-sm text-slate-500">User: {session.userEmail} &bull; Score: {session.score}</p>
                                    </div>
                                    <div className="flex-shrink-0">{getStatusChip(session.status || 'pending')}</div>
                                </div>
                                {(!session.status || session.status === 'pending') && (
                                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200">
                                        <button onClick={() => handleApproveSession(session.id)} className="flex-1 bg-green-600 text-white text-sm font-semibold py-2 px-3 rounded-lg hover:bg-green-700">Approve</button>
                                        <button onClick={() => handleRejectSession(session)} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2 px-3 rounded-lg hover:bg-red-700">Reject</button>
                                    </div>
                                )}
                            </div>
                        )) : <p className="text-slate-500 text-center py-4">No user sessions found.</p>}
                    </div>
                </div>

                 {/* User Feedback Section */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><AnnotationIcon /> User Feedback</h2>
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                        {userFeedback.length > 0 ? userFeedback.map(fb => (
                            <div key={fb.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                    <div>
                                        <p className="font-semibold text-slate-800">{fb.userName} <span className="font-normal text-slate-500">({fb.userEmail})</span></p>
                                        <p className="text-sm text-slate-500">Type: <span className="font-medium capitalize">{fb.type}</span></p>
                                    </div>
                                    <div className="flex-shrink-0">{getStatusChip(fb.status)}</div>
                                </div>
                                <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 text-sm">"{fb.message}"</p>
                                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleFeedbackStatusChange(fb.id, 'viewed')} disabled={fb.status === 'viewed' || fb.status === 'resolved'} className="text-xs font-medium text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline">Mark as Viewed</button>
                                        <button onClick={() => handleFeedbackStatusChange(fb.id, 'resolved')} disabled={fb.status === 'resolved'} className="text-xs font-medium text-green-600 hover:underline disabled:text-slate-400 disabled:no-underline">Mark as Resolved</button>
                                    </div>
                                    <button onClick={() => handleDeleteFeedback(fb.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-slate-500 text-center py-4">No user feedback submitted yet.</p>}
                    </div>
                </div>
            </main>

            <aside className="space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><BookOpenIcon /> Content Management</h2>
                    <div className="space-y-3">
                        <button onClick={() => handleMockAction('uploadMaterials', 'Upload Materials', 'This would open a file dialog to upload new learning materials.')} className="w-full text-left bg-slate-100 hover:bg-slate-200 p-3 rounded-lg font-medium text-slate-700">Upload Learning Materials</button>
                        <button onClick={() => handleMockAction('postAnnouncement', 'Post Announcement')} className="w-full text-left bg-slate-100 hover:bg-slate-200 p-3 rounded-lg font-medium text-slate-700">Post Announcement</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                     <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><QuestionMarkCircleIcon /> Support & Feedback</h2>
                    <div className="space-y-3">
                         <button onClick={() => handleMockAction('viewQueries', 'User Queries', 'This would navigate to a page for viewing and responding to user support tickets.')} className="w-full text-left bg-slate-100 hover:bg-slate-200 p-3 rounded-lg font-medium text-slate-700">View User Queries</button>
                         <button onClick={() => handleMockAction('accessFeedback', 'Feedback Forms', 'This would navigate to a page for accessing user feedback forms.')} className="w-full text-left bg-slate-100 hover:bg-slate-200 p-3 rounded-lg font-medium text-slate-700">Access Feedback Forms</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><SettingsIcon /> Settings</h2>
                    <div className="space-y-3">
                         <button onClick={() => handleMockAction('changePassword', 'Change Password', 'This would open a form to change the admin password.')} className="w-full text-left bg-slate-100 hover:bg-slate-200 p-3 rounded-lg font-medium text-slate-700">Change Admin Password</button>
                         <button onClick={() => handleMockAction('configureSettings', 'Site Settings', 'This would navigate to a page for configuring site settings like branding and notifications.')} className="w-full text-left bg-slate-100 hover:bg-slate-200 p-3 rounded-lg font-medium text-slate-700">Configure Site Settings</button>
                         <button onClick={() => handleMockAction('manageRoles', 'Manage Roles', 'This would open an interface for managing user roles and permissions.')} className="w-full text-left bg-slate-100 hover:bg-slate-200 p-3 rounded-lg font-medium text-slate-700">Manage Roles</button>
                    </div>
                </div>
            </aside>
        </div>
    </div>
    <Modal isOpen={!!modalState} onClose={closeModal} title={modalState?.title || ''}>
       <ModalContent
            modalState={modalState}
            closeModal={closeModal}
            modalInputValue={modalInputValue}
            setModalInputValue={setModalInputValue}
            modalInputEmail={modalInputEmail}
            setModalInputEmail={setModalInputEmail}
            confirmEditUser={confirmEditUser}
            confirmResetPassword={confirmResetPassword}
            confirmRemoveUser={confirmRemoveUser}
            confirmAddUser={confirmAddUser}
            confirmPostAnnouncement={confirmPostAnnouncement}
            confirmRejectSession={confirmRejectSession}
        />
    </Modal>
    </>
  );
};


// Helper component to prevent re-rendering the entire admin page on modal input change
const ModalContent: React.FC<any> = ({
    modalState, closeModal, modalInputValue, setModalInputValue, modalInputEmail, setModalInputEmail,
    confirmEditUser, confirmResetPassword, confirmRemoveUser, confirmAddUser,
    confirmPostAnnouncement, confirmRejectSession
}) => {
    if (!modalState) return null;

    const renderTextField = (label: string, placeholder: string, value: string, setter: (val: string) => void, type: 'text' | 'email' | 'password' = 'text') => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input type={type} value={value} onChange={(e) => setter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder={placeholder} autoFocus={type==='text'}
            />
        </div>
    );

    const renderConfirmation = (message: string, onConfirm: () => void, icon: React.ReactNode, confirmText: string, confirmClass: string = 'bg-red-600 hover:bg-red-700') => (
         <div className="space-y-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100">{icon}</div>
                <p className="text-slate-600 mt-1.5">{message}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeModal} className="bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button>
                <button onClick={onConfirm} className={`${confirmClass} text-white font-semibold py-2 px-4 rounded-lg`}>{confirmText}</button>
            </div>
        </div>
    );

    const renderInfo = (message: string, isError: boolean = false) => (
         <div className="space-y-4">
            <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isError ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {isError ? <XCircleIcon className="w-6 h-6 text-red-600" /> : <InfoCircleIcon className="w-6 h-6 text-blue-600" />}
                </div>
                <p className="text-slate-600 mt-1.5">{message}</p>
            </div>
            <div className="flex justify-end pt-2">
                <button onClick={closeModal} className="bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors">OK</button>
            </div>
        </div>
    );

    switch (modalState.type) {
        case 'info': return renderInfo(modalState.data.message);
        case 'error': return renderInfo(modalState.data.message, true);
        
        case 'editUser': return (
            <div className="space-y-4">
                {renderTextField('New Name', 'Enter new name...', modalInputValue, setModalInputValue)}
                <div className="flex justify-end"><button onClick={confirmEditUser} className="bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg">Save Changes</button></div>
            </div>
        );
        case 'resetPassword': return renderConfirmation(`Are you sure you want to send a password reset link to ${modalState.data.email}?`, confirmResetPassword, <KeyIcon className="w-6 h-6 text-yellow-600" />, 'Send Link', 'bg-yellow-500 hover:bg-yellow-600');
        case 'removeUser': return renderConfirmation(`This will permanently delete the user ${modalState.data.email}. This action cannot be undone.`, confirmRemoveUser, <WarningIcon className="w-6 h-6 text-red-600" />, 'Delete User');
        case 'addUser': return (
             <div className="space-y-4">
                {renderTextField('Full Name', 'John Doe...', modalInputValue, setModalInputValue)}
                {renderTextField('Email Address', 'user@example.com...', modalInputEmail, setModalInputEmail, 'email')}
                <div className="flex justify-end"><button onClick={confirmAddUser} className="bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg">Add User</button></div>
            </div>
        );
        case 'postAnnouncement': return (
             <div className="space-y-4">
                {renderTextField('Announcement', 'Type here...', modalInputValue, setModalInputValue)}
                <div className="flex justify-end"><button onClick={confirmPostAnnouncement} className="bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg">Post</button></div>
            </div>
        );
        case 'rejectSession': return (
             <div className="space-y-4">
                <p className="text-slate-600 text-sm">Please provide a reason for rejecting the session for "{modalState.data.phrase}". This will be sent to the user.</p>
                {renderTextField('Reason for Rejection', 'e.g., Background noise too high...', modalInputValue, setModalInputValue)}
                <div className="flex justify-end"><button onClick={confirmRejectSession} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">Reject & Send Feedback</button></div>
            </div>
        );
        default: return null;
    }
};