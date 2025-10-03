import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, BarChart3, MessageSquare, Shield, Zap, Users, CheckCircle2, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: "Project Management",
      description: "Organize unlimited projects with version control and client collaboration"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track progress, revenue, and productivity with beautiful visualizations"
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "WhatsApp-style messaging for seamless communication with clients"
    },
    {
      icon: Shield,
      title: "Payment Tracking",
      description: "Invoice generation, payment tracking, and automated billing"
    },
    {
      icon: Zap,
      title: "AI Assistant",
      description: "Context-aware chatbot for instant project insights and automation"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Agency plans with multi-user support and role-based permissions"
    }
  ];

  const plans = [
    {
      name: "Basic",
      price: "₹999",
      features: ["5 Active Projects", "Basic Analytics", "Email Support", "1GB Storage"]
    },
    {
      name: "Pro",
      price: "₹2,499",
      features: ["25 Active Projects", "Advanced Analytics", "Priority Support", "10GB Storage", "Team Collaboration"],
      popular: true
    },
    {
      name: "Premium",
      price: "₹4,999",
      features: ["Unlimited Projects", "Full Analytics Suite", "24/7 Support", "100GB Storage", "White Label", "API Access"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-success/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6 shadow-glow animate-pulse">
            <Video className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            Xrozen Workflow
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional Video Editing Project Management Platform
          </p>
          <p className="text-lg text-muted-foreground mb-10">
            Streamline your video editing workflow with powerful project management, 
            real-time collaboration, and intelligent automation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-primary shadow-elegant hover:shadow-glow transition-smooth text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            ✨ 1-month free trial • ₹2 activation fee • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for video editors, clients, and agencies
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="bg-card p-6 rounded-2xl shadow-elegant hover:shadow-glow transition-smooth border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your workflow • Available for Editors, Clients, and Agencies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-card p-8 rounded-2xl shadow-elegant border-2 transition-smooth hover:shadow-glow ${
                plan.popular ? 'border-primary gradient-primary' : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="bg-success text-success-foreground text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${plan.popular ? 'gradient-success' : 'gradient-primary'}`}
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Start Free Trial
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-12 max-w-2xl mx-auto">
          All plans include a <strong>1-month free trial</strong> with full access to features. 
          Only a one-time ₹2 activation fee required. Cancel anytime before trial ends.
        </p>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-card rounded-3xl shadow-elegant p-12 text-center max-w-4xl mx-auto border border-border">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join video editors and agencies using Xrozen Workflow to streamline their projects
          </p>
          <Button 
            size="lg" 
            className="gradient-primary shadow-glow text-lg px-12"
            onClick={() => navigate("/auth")}
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Xrozen Workflow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
