
export interface Post {
  id: string;
  type: 'dev' | 'cyber';
  title: string;
  author: string;
  timeAgo: string;
  preview: string;
  content: string; // Added full content
  tags: string[];
  likes: number;
  commentsCount: number;
  isResolved?: boolean;
  comments: Comment[]; // Added comments array
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timeAgo: string;
  likes: number;
}

export const posts: Post[] = [
  {
    id: "dev-1",
    type: "dev",
    title: 'How to fix "TypeError: Cannot read property map of undefined" in React?',
    author: "Alice",
    timeAgo: "33 minutes ago",
    preview: "I'm getting this frustrating error in my React component...",
    content: `I'm getting this frustrating error in my React component when trying to render a list. The data comes from an API call.
    
    Here is my code:
    \`\`\`jsx
    function MyList({ items }) {
      return (
        <ul>
          {items.map(item => <li key={item.id}>{item.name}</li>)}
        </ul>
      );
    }
    \`\`\`
    
    The error happens when the component first mounts. Any ideas?`,
    tags: ["react", "javascript", "typeerror"],
    likes: 12,
    commentsCount: 5,
    comments: [
      { id: "c1", author: "Bob", content: "You need to check if items exists before mapping. Try `items?.map(...)` or provide a default value.", timeAgo: "10m ago", likes: 3 },
      { id: "c2", author: "Charlie", content: "This usually happens because the API call is async. Initialize your state with an empty array `[]`.", timeAgo: "5m ago", likes: 5 }
    ]
  },
  {
    id: "dev-2",
    type: "dev",
    title: "Best practices for Next.js 14 Server Actions?",
    author: "BobDeployer",
    timeAgo: "2 hours ago",
    preview: "I'm migrating from Pages router to App router...",
    content: "I'm migrating from Pages router to App router and want to understand how to handle form submissions securely without API routes. What are the security implications of binding server actions directly to forms?",
    tags: ["nextjs", "server-actions", "backend"],
    likes: 45,
    commentsCount: 18,
    isResolved: true,
    comments: []
  },
  {
    id: "dev-3",
    type: "dev",
    title: "Understanding Rust ownership model coming from Python",
    author: "RustNewbie",
    timeAgo: "5 hours ago",
    preview: "I'm struggling with the borrow checker...",
    content: "I'm struggling with the borrow checker. Does anyone have good resources or analogies for understanding lifetimes? Coming from Python, this concept is completely alien to me.",
    tags: ["rust", "learning", "memory-safety"],
    likes: 89,
    commentsCount: 32,
    comments: []
  },
  {
    id: "cyber-1",
    type: "cyber",
    title: "New XSS vector found in popular React library",
    author: "0xHunter",
    timeAgo: "15 minutes ago",
    preview: "I found a way to bypass the sanitizer...",
    content: "I found a way to bypass the sanitizer when passing specific SVG props. Here is the POC... (Redacted for safety). Be careful when allowing user-uploaded SVGs.",
    tags: ["xss", "vulnerability", "react"],
    likes: 124,
    commentsCount: 42,
    comments: []
  },
  {
    id: "cyber-2",
    type: "cyber",
    title: "Best tools for lateral movement detection?",
    author: "BlueTeamLead",
    timeAgo: "4 hours ago",
    preview: "We are evaluating different EDR solutions...",
    content: "We are evaluating different EDR solutions. What are you using to detect lateral movement in Windows AD environments? Specifically interested in detecting Pass-the-Hash attacks.",
    tags: ["blue-team", "edr", "active-directory"],
    likes: 56,
    commentsCount: 28,
    isResolved: true,
    comments: []
  },
  {
    id: "cyber-3",
    type: "cyber",
    title: "Reverse engineering the new malware sample",
    author: "MalwareAnalyst",
    timeAgo: "1 day ago",
    preview: "I've unpacked the sample and it seems to be using...",
    content: "I've unpacked the sample and it seems to be using a custom packer. Looking for help identifying this obfuscation technique. I've attached a screenshot of the entry point in Ghidra.",
    tags: ["malware", "reverse-engineering", "assembly"],
    likes: 89,
    commentsCount: 15,
    comments: []
  }
];
