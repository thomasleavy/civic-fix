import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const About = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            About <span className="text-primary-600 dark:text-primary-400">CivicFix</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Empowering Citizens, Strengthening Communities
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            CivicFix is a community-driven platform designed to bridge the gap between citizens and local government. 
            We believe that every voice matters and that direct communication between residents and their councils 
            is essential for building stronger, more responsive communities.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Our mission is to make civic engagement accessible, transparent, and effective by providing a simple, 
            user-friendly platform where residents can report local issues, share improvement suggestions, and 
            actively participate in shaping their communities.
          </p>
        </section>

        {/* What We Do Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">⚠️</span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Issue Reporting</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Report local issues such as potholes, fallen electrical wiring, broken streetlights, 
                and other infrastructure problems directly to your local council. Track the status of 
                your reports and see how your community is being improved.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">💡</span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Community Suggestions</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Share your ideas for community improvements. Whether it's a new park, better public 
                transportation, or enhanced community facilities, your suggestions help shape the 
                future of your area.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">🗺️</span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Civic Space</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Explore public issues and suggestions from your county. See what matters to your 
                neighbors, support popular initiatives, and stay informed about local civic activity.
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">📊</span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Transparency & Tracking</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Every submission receives a unique case ID for easy reference. Track the progress 
                of your reports and suggestions, and see how your engagement contributes to positive 
                change in your community.
              </p>
            </div>
          </div>
        </section>

        {/* Civic Engagement Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">The Power of Civic Engagement</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Civic engagement is the cornerstone of a healthy democracy. When citizens actively participate 
            in their communities, they help ensure that local government is responsive, accountable, and 
            aligned with the needs and values of the people it serves.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Why Your Voice Matters</h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>Your reports help identify problems that might otherwise go unnoticed</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>Your suggestions contribute to community planning and development</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>Collective engagement creates a stronger voice for your community</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                <span>Active participation builds trust between citizens and government</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Direct Democracy Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Direct Democracy in Action</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            CivicFix embodies the principles of direct democracy by giving citizens a direct channel 
            to communicate with their local government. Unlike traditional methods that may feel 
            bureaucratic or distant, our platform makes civic participation immediate and accessible.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Through CivicFix, you can:
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="text-4xl mb-2">📝</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Submit</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Report issues or share suggestions with ease</p>
            </div>
            <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="text-4xl mb-2">👀</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Track</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Monitor the status and progress of your submissions</p>
            </div>
            <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="text-4xl mb-2">🤝</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Engage</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Support and amplify community initiatives</p>
            </div>
          </div>
        </section>

        {/* Advocacy Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Community Advocacy</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Advocacy is about speaking up for what matters to you and your community. CivicFix provides 
            the tools and platform to make your advocacy efforts more effective:
          </p>
          <div className="space-y-4">
            <div className="border-l-4 border-primary-600 dark:border-primary-400 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Amplify Your Voice</h3>
              <p className="text-gray-700 dark:text-gray-300">
                When you make your issues or suggestions public, they become visible to all residents 
                in your county. This visibility helps build support and demonstrates community consensus 
                on important matters.
              </p>
            </div>
            <div className="border-l-4 border-primary-600 dark:border-primary-400 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Build Momentum</h3>
              <p className="text-gray-700 dark:text-gray-300">
                The trending feature highlights popular issues and suggestions, showing what matters 
                most to your community. This helps prioritise action and demonstrates widespread 
                support for specific initiatives.
              </p>
            </div>
            <div className="border-l-4 border-primary-600 dark:border-primary-400 pl-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Create Change</h3>
              <p className="text-gray-700 dark:text-gray-300">
                By documenting issues and suggestions with photos, detailed descriptions, and case IDs, 
                you provide local government with the information they need to take action. Your advocacy 
                becomes data-driven and actionable.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Create an Account</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Sign up with your email and complete your profile. Select your county to ensure 
                  your submissions are properly categorised.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Report or Suggest</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Submit an issue report or community suggestion. Include photos, detailed descriptions, 
                  and choose whether to make it public or private.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Track Progress</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Receive a unique case ID for your submission. Monitor its status as it moves through 
                  review, implementation, or resolution.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Engage with Your Community</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Explore the Civic Space for your county, support trending issues and suggestions, 
                  and see how your community is working together for positive change.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl mb-6 opacity-90">
            Join thousands of citizens who are actively shaping their communities through CivicFix.
          </p>
          {!isAuthenticated ? (
            <div className="flex justify-center space-x-4">
              <Link
                to="/civicfix?tab=register"
                className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/civic-space"
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-400 transition-colors"
              >
                Explore Civic Space
              </Link>
            </div>
          ) : (
            <div className="flex justify-center space-x-4">
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/civic-space"
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-400 transition-colors"
              >
                Explore Civic Space
              </Link>
            </div>
          )}
        </section>

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
          <p>
            CivicFix is committed to fostering civic engagement and strengthening the connection 
            between citizens and local government across Ireland.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
