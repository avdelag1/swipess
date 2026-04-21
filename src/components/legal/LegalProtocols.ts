export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

export interface LegalProtocol {
  title: string;
  lastUpdated: string;
  introduction: string;
  sections: LegalSection[];
}

export const TERMS_PROTOCOL: LegalProtocol = {
  title: "Terms of Service Protocol",
  lastUpdated: "January 2026",
  introduction: "Initialization of the NEXUS DISCOVERY Nexus constitutes binding acceptance of these Operational Protocols. Access is denied to non-compliant entities.",
  sections: [
    {
      id: "01",
      title: "Entity Eligibility",
      content: "Entities must be at least 18 individual orbits (years) of age to initialize a NEXUS DISCOVERY profile. By accessing this platform, you certify that you possess the full legal capacity to enter binding digital agreements under the jurisdiction of the Cyber-Laws of Earth and its relevant territories."
    },
    {
      id: "02",
      title: "Identity Integrity",
      content: "Users are responsible for maintaining the encryption integrity of their access keys (passwords). NEXUS DISCOVERY is not liable for data breaches resulting from local credential leakage. Total identity transparency is required: fraudulent profiles, bots, or sybil entities will be purged from the registry without notice."
    },
    {
      id: "03",
      title: "Discovery Protocols",
      content: "NEXUS DISCOVERY provides a matchmaking matrix between asset owners and seekers. While the matrix facilitates matches, the platform does not guarantee the performance of external contracts, physical asset conditions, or the conduct of other entities beyond the digital interface."
    },
    {
      id: "04",
      title: "Prohibited Acts",
      content: "Prohibited actions include: extraction of registry data via scraping, harassment of neighboring entities, transmission of malicious code, and any attempt to bypass the Nexus security firewall. Violations trigger immediate account suspension and potential legal synchronization."
    },
    {
      id: "05",
      title: "Subscription & Assets",
      content: "Certain dashboard features require token allocation or subscription sync. Fees are processed via authorized financial endpoints and are generally non-refundable once the service cycle has been initialized."
    }
  ]
};

export const PRIVACY_PROTOCOL: LegalProtocol = {
  title: "Privacy & Data Protocol",
  lastUpdated: "January 2026",
  introduction: "Protecting the integrity of your personal logs is our highest directive. NEXUS DISCOVERY utilizes advanced end-to-end encryption for all sensitive profile data.",
  sections: [
    {
      id: "01",
      title: "Data Acquisition",
      content: "We collect only the telemetry data required to optimize your matching experience: verified email, authentication tokens, and basic interaction logs. Real-world location data is strictly used for the 'Sentinel Radar' discovery and is NEVER sold to external data brokers."
    },
    {
      id: "02",
      title: "Third-Party Sync",
      content: "NEXUS DISCOVERY integrates with authorized identity providers (Apple, Google, Facebook) to facilitate seamless onboarding. We share only the minimum required metadata with these entities to maintain your session."
    },
    {
      id: "03",
      title: "Storage & Retention",
      content: "Your profile logs are stored in encrypted cloud-vaults. Upon account deletion, all personal metadata is purged from our primary index within 30 solar days, except where retention is mandated by global financial regulations."
    },
    {
      id: "04",
      title: "Entity Rights",
      content: "You retain total authority over your personal logs. You may request a full export of your identity data or trigger a 'Right to be Forgotten' command at any time via the Security Settings dashboard."
    }
  ]
};


