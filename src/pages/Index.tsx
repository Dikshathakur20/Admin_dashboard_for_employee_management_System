import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Employee Management System</h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Comprehensive admin dashboard for managing employees, departments, and designations with powerful CRUD operations.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elegant">
              <Shield className="w-5 h-5 mr-2" />
              Admin Login
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-white/10 border-white/20 text-white backdrop-blur-sm shadow-card animate-fade-in">
            <CardHeader>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription className="text-white/80">
                Complete CRUD operations for employee records with detailed information tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• Add new employees with full details</li>
                <li>• Edit existing employee information</li>
                <li>• Delete employee records</li>
                <li>• Search and filter employees</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white backdrop-blur-sm shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <Building className="w-6 h-6" />
              </div>
              <CardTitle>Department Control</CardTitle>
              <CardDescription className="text-white/80">
                Organize your workforce with comprehensive department management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• Create and manage departments</li>
                <li>• Set department locations</li>
                <li>• Assign employees to departments</li>
                <li>• Track department statistics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white backdrop-blur-sm shadow-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <CardTitle>Secure Access</CardTitle>
              <CardDescription className="text-white/80">
                Role-based admin authentication with secure data management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• Admin-only access control</li>
                <li>• Secure authentication system</li>
                <li>• Protected dashboard routes</li>
                <li>• Session management</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-white/90 mb-4">Ready to manage your workforce effectively?</p>
          <Link to="/auth">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
