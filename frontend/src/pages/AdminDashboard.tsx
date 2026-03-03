import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface UserRecord {
    _id: string;
    name: string;
    email: string;
    grade: string;
    board: string;
    role: string;
    isActive: boolean;
    authMethod: string;
    createdAt: string;
    subjects: string[];
}

const AdminDashboard: React.FC = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    const fetchUsers = useCallback(async () => {
        try {
            const response = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchUsers();
    }, [user, navigate, fetchUsers]);

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        try {
            await axios.patch(
                `/api/users/${userId}/status`,
                { isActive: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsers(users.map(u =>
                u._id === userId ? { ...u, isActive: !currentStatus } : u
            ));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update user status');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteUser = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
            return;
        }
        setActionLoading(userId);
        try {
            await axios.delete(`/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u._id !== userId));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filterStatus === 'all' ||
            (filterStatus === 'active' && u.isActive !== false) ||
            (filterStatus === 'inactive' && u.isActive === false);
        return matchesSearch && matchesFilter;
    });

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive !== false).length;
    const inactiveUsers = users.filter(u => u.isActive === false).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Manage all registered users</p>
            </div>

            {/* Error display */}
            {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                    <button
                        onClick={() => setError('')}
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                    >
                        <span className="text-xl">&times;</span>
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
                    <div className="text-sm font-medium text-gray-500">Total Users</div>
                    <div className="mt-1 text-3xl font-bold text-gray-900">{totalUsers}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
                    <div className="text-sm font-medium text-gray-500">Active Users</div>
                    <div className="mt-1 text-3xl font-bold text-green-600">{activeUsers}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
                    <div className="text-sm font-medium text-gray-500">Inactive Users</div>
                    <div className="mt-1 text-3xl font-bold text-red-600">{inactiveUsers}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All ({totalUsers})
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'active'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Active ({activeUsers})
                        </button>
                        <button
                            onClick={() => setFilterStatus('inactive')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'inactive'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Inactive ({inactiveUsers})
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grade / Board
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Auth Method
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((u) => (
                                <tr key={u._id} className={u.isActive === false ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {u.grade || '—'} / {u.board || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {u.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive !== false
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {u.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                        {u.authMethod || 'email'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {u.role !== 'admin' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => toggleUserStatus(u._id, u.isActive !== false)}
                                                    disabled={actionLoading === u._id}
                                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${u.isActive !== false
                                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {actionLoading === u._id ? '...' : u.isActive !== false ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(u._id, u.name)}
                                                    disabled={actionLoading === u._id}
                                                    className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === u._id ? '...' : 'Delete'}
                                                </button>
                                            </div>
                                        )}
                                        {u.role === 'admin' && (
                                            <span className="text-xs text-gray-400 italic">Admin</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
