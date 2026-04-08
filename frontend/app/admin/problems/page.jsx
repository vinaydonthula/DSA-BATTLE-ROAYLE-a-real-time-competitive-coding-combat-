'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Edit2, Trash2, Code, X, Loader2 } from 'lucide-react';
import { adminAPI } from '@/services/api';

export default function AdminProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'medium',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    starterCode: '',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    sampleTestCases: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', output: '' }],
  });

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    fetchProblems();
  }, [router]);

  const fetchProblems = async () => {
    try {
      const data = await adminAPI.getProblems();
      setProblems(data);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingProblem) {
        await adminAPI.updateProblem(editingProblem.id, formData);
      } else {
        await adminAPI.createProblem(formData);
      }
      await fetchProblems();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save problem:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;

    try {
      await adminAPI.deleteProblem(id);
      await fetchProblems();
    } catch (error) {
      console.error('Failed to delete problem:', error);
    }
  };

  const handleEdit = (problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      difficulty: problem.difficulty,
      description: problem.description,
      inputFormat: problem.inputFormat || '',
      outputFormat: problem.outputFormat || '',
      constraints: problem.constraints || '',
      starterCode: problem.starterCode || '',
      timeLimitMs: problem.timeLimitMs || 1000,
      memoryLimitMb: problem.memoryLimitMb || 256,
      sampleTestCases: problem.sampleTestCases || [{ input: '', output: '', explanation: '' }],
      testCases: problem.testCases || [{ input: '', output: '' }],
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProblem(null);
    setFormData({
      title: '',
      difficulty: 'medium',
      description: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      starterCode: '',
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      sampleTestCases: [{ input: '', output: '', explanation: '' }],
      testCases: [{ input: '', output: '' }],
    });
  };

  const addSampleTestCase = () => {
    setFormData({
      ...formData,
      sampleTestCases: [...formData.sampleTestCases, { input: '', output: '', explanation: '' }],
    });
  };

  const removeSampleTestCase = (index) => {
    const newTestCases = formData.sampleTestCases.filter((_, i) => i !== index);
    setFormData({ ...formData, sampleTestCases: newTestCases });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', output: '' }],
    });
  };

  const removeTestCase = (index) => {
    const newTestCases = formData.testCases.filter((_, i) => i !== index);
    setFormData({ ...formData, testCases: newTestCases });
  };

  const updateTestCase = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index][field] = value;
    setFormData({ ...formData, testCases: newTestCases });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-800 border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminRole');
                router.push('/admin/login');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Problem Management</h2>
            <p className="text-slate-400">Manage DSA problems for duels and contests</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-red-500/50 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Problem</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-red-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-bold text-white">{problem.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        problem.difficulty === 'easy'
                          ? 'bg-green-500/20 text-green-400'
                          : problem.difficulty === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-4">{problem.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <span>{problem.testCases?.length || 0} test cases</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(problem)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(problem.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {editingProblem ? 'Edit Problem' : 'Add New Problem'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Problem Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder="Two Sum"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-24"
                  placeholder="Describe the problem..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Input Format
                  </label>
                  <textarea
                    value={formData.inputFormat}
                    onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-20"
                    placeholder="First line contains n..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Output Format
                  </label>
                  <textarea
                    value={formData.outputFormat}
                    onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-20"
                    placeholder="Print the result..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Constraints
                </label>
                <textarea
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-20"
                  placeholder="- 1 <= n <= 10^5&#10;- -10^9 <= arr[i] <= 10^9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Time Limit (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.timeLimitMs}
                    onChange={(e) => setFormData({ ...formData, timeLimitMs: parseInt(e.target.value) || 1000 })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Memory Limit (MB)
                  </label>
                  <input
                    type="number"
                    value={formData.memoryLimitMb}
                    onChange={(e) => setFormData({ ...formData, memoryLimitMb: parseInt(e.target.value) || 256 })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="256"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">
                    Sample Test Cases (Visible to Users)
                  </label>
                  <button
                    type="button"
                    onClick={addSampleTestCase}
                    className="text-sm text-red-500 hover:text-red-400 font-medium"
                  >
                    + Add Sample
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.sampleTestCases.map((testCase, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">Sample {index + 1}</span>
                        {formData.sampleTestCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSampleTestCase(index)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Input</label>
                          <textarea
                            value={testCase.input}
                            onChange={(e) => {
                              const newCases = [...formData.sampleTestCases];
                              newCases[index].input = e.target.value;
                              setFormData({ ...formData, sampleTestCases: newCases });
                            }}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                            placeholder="4&#10;2 7 11 15&#10;9"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Output</label>
                          <textarea
                            value={testCase.output}
                            onChange={(e) => {
                              const newCases = [...formData.sampleTestCases];
                              newCases[index].output = e.target.value;
                              setFormData({ ...formData, sampleTestCases: newCases });
                            }}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                            placeholder="0 1"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Explanation</label>
                          <input
                            type="text"
                            value={testCase.explanation}
                            onChange={(e) => {
                              const newCases = [...formData.sampleTestCases];
                              newCases[index].explanation = e.target.value;
                              setFormData({ ...formData, sampleTestCases: newCases });
                            }}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Because nums[0] + nums[1] == 9..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">
                    Hidden Test Cases (For Judging)
                  </label>
                  <button
                    type="button"
                    onClick={addTestCase}
                    className="text-sm text-red-500 hover:text-red-400 font-medium"
                  >
                    + Add Test Case
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.testCases.map((testCase, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">Test Case {index + 1}</span>
                        {formData.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestCase(index)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Input</label>
                          <textarea
                            value={testCase.input}
                            onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                            placeholder="4&#10;2 7 11 15&#10;9"
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Output</label>
                          <textarea
                            value={testCase.output}
                            onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                            placeholder="0 1"
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-red-500/50"
                >
                  {editingProblem ? 'Update Problem' : 'Create Problem'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
