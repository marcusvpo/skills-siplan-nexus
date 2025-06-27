
import React from 'react';
import Layout from '@/components/Layout';
import AdminDashboardAudited from '@/components/admin/AdminDashboardAudited';

const AdminDashboard: React.FC = () => {
  return (
    <Layout>
      <AdminDashboardAudited />
    </Layout>
  );
};

export default AdminDashboard;
