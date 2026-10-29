import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Home = () => {
  const { isAuthenticated } = useAuth()

  const styles = {
    hero: {
      background: 'linear-gradient(135deg, #15803d 0%, #166534 50%, #14532d 100%)',
      color: '#ffffff',
      padding: '80px 1rem',
      textAlign: 'center',
    },
    heroTitle: {
      fontSize: '3rem',
      fontWeight: '800',
      marginBottom: '1rem',
    },
    heroSubtitle: {
      fontSize: '1.25rem',
      opacity: 0.9,
      marginBottom: '2rem',
      maxWidth: '600px',
      margin: '0 auto 2rem',
    },
    ctaButton: {
      display: 'inline-block',
      backgroundColor: '#ffffff',
      color: '#15803d',
      padding: '14px 32px',
      borderRadius: '8px',
      fontWeight: '700',
      fontSize: '1.1rem',
      textDecoration: 'none',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    section: {
      padding: '80px 1rem',
    },
    sectionTitle: {
      textAlign: 'center',
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '3rem',
      color: '#1a1a1a',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    featureCard: {
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      padding: '2rem',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    featureIcon: {
      fontSize: '3rem',
      marginBottom: '1rem',
    },
    featureTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      marginBottom: '0.5rem',
      color: '#1a1a1a',
    },
    featureDesc: {
      color: '#6b7280',
      lineHeight: '1.6',
    },
    stepsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    stepCard: {
      textAlign: 'center',
      padding: '2rem',
    },
    stepNumber: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: '#15803d',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      fontWeight: '700',
      margin: '0 auto 1rem',
    },
    stepTitle: {
      fontSize: '1.1rem',
      fontWeight: '700',
      marginBottom: '0.5rem',
      color: '#1a1a1a',
    },
    stepDesc: {
      color: '#6b7280',
      fontSize: '0.95rem',
    },
    ctaSection: {
      backgroundColor: '#f0fdf4',
      padding: '60px 1rem',
      textAlign: 'center',
    },
    ctaTitle: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    ctaText: {
      color: '#6b7280',
      marginBottom: '2rem',
      fontSize: '1.1rem',
    },
    ctaButtonSecondary: {
      display: 'inline-block',
      backgroundColor: '#15803d',
      color: '#ffffff',
      padding: '14px 32px',
      borderRadius: '8px',
      fontWeight: '700',
      fontSize: '1.1rem',
      textDecoration: 'none',
    },
    linkSecondary: {
      display: 'block',
      marginTop: '1rem',
      color: '#15803d',
      fontWeight: '600',
    },
  }

  return (
    <div>
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Video Rewards Rwanda</h1>
        <p style={styles.heroSubtitle}>
          Watch videos, earn rewards, and get paid. Join thousands of Rwandans
          already earning money by watching videos every day.
        </p>
        <Link to={isAuthenticated ? '/dashboard' : '/register'} style={styles.ctaButton}>
          {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
        </Link>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🎬</div>
            <h3 style={styles.featureTitle}>Watch Videos</h3>
            <p style={styles.featureDesc}>
              Browse and watch a wide variety of videos curated for our community.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💰</div>
            <h3 style={styles.featureTitle}>Earn Rewards</h3>
            <p style={styles.featureDesc}>
              Earn points for every video you watch. Points can be converted to money.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🏦</div>
            <h3 style={styles.featureTitle}>Withdraw Money</h3>
            <p style={styles.featureDesc}>
              Withdraw your earnings directly to your mobile money or bank account.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>👥</div>
            <h3 style={styles.featureTitle}>Refer Friends</h3>
            <p style={styles.featureDesc}>
              Invite friends and earn bonus rewards for every successful referral.
            </p>
          </div>
        </div>
      </section>

      <section style={{ ...styles.section, backgroundColor: '#f9fafb' }}>
        <h2 style={styles.sectionTitle}>Getting Started</h2>
        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Create Account</h3>
            <p style={styles.stepDesc}>Sign up with your email or phone number in seconds.</p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Watch Videos</h3>
            <p style={styles.stepDesc}>Browse categories and start watching videos you enjoy.</p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Earn Points</h3>
            <p style={styles.stepDesc}>Collect points for each video watched and completed.</p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>4</div>
            <h3 style={styles.stepTitle}>Get Paid</h3>
            <p style={styles.stepDesc}>Withdraw your earnings to your preferred payment method.</p>
          </div>
        </div>
      </section>

      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to Start Earning?</h2>
        <p style={styles.ctaText}>Join now and start watching videos to earn real money.</p>
        <Link to="/register" style={styles.ctaButtonSecondary}>Create Free Account</Link>
        <br />
        <Link to="/login" style={styles.linkSecondary}>Already have an account? Sign in</Link>
      </section>
    </div>
  )
}

export default Home