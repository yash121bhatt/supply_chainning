import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/AuthContext';
import { authAPI } from '../services';
import { User, LogOut, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const HeaderProfile = () => {
  const navigate = useNavigate();
  const { user, logout, updateAvatar } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    return avatar;
  };
  const [preview, setPreview] = useState(user?.avatar ? getAvatarUrl(user.avatar) : null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = user?.avatar ? getAvatarUrl(user.avatar) : null;
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, JPEG, and PNG images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await authAPI.uploadAvatar(formData);
      const newAvatar = response.data.user.avatar;
      updateAvatar(newAvatar);
      toast.success('Avatar updated successfully');
    } catch {
      toast.error('Failed to upload avatar');
      setPreview(avatarUrl);
    } finally {
      setUploading(false);
      setDropdownOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // proceed with local logout
    }
    logout();
    navigate('/login');
  };

  const handleViewProfile = () => {
    navigate(`/${user?.role}/profile`);
    setDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center border-2 border-gray-200 text-sm font-semibold">
            {initial}
          </div>
        )}
      </button>

      {uploading && (
        <div className="absolute top-12 right-0 z-50 bg-white rounded-lg shadow-lg border p-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            Uploading...
          </div>
        </div>
      )}

      {dropdownOpen && !uploading && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border overflow-hidden z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <label className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Camera size={16} />
            Change Avatar
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <button
            onClick={handleViewProfile}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <User size={16} />
            View Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderProfile;
