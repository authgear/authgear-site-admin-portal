export interface TeamListItem {
  id: string;
  projectName: string;
  projectId: string;
  ownerEmail: string;
  plan: string;
  createdAt: string;
}

export const MOCK_TEAMS: TeamListItem[] = [
  {
    id: "1",
    projectName: "SuperApp",
    projectId: "super-app-234",
    ownerEmail: "alex.tsai@superapp.com",
    plan: "Enterprise",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
  {
    id: "2",
    projectName: "SuperCampaign",
    projectId: "super-abcd-123",
    ownerEmail: "admin@superapp.com",
    plan: "Free",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
  {
    id: "3",
    projectName: "ACME Corp",
    projectId: "acme-corp-999",
    ownerEmail: "it@sample-acme.com",
    plan: "Enterprise",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
  {
    id: "4",
    projectName: "SuperApp",
    projectId: "print-promote-359",
    ownerEmail: "alex.chang@superapp.com",
    plan: "Business",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
  {
    id: "5",
    projectName: "Wisemart",
    projectId: "wise-apple-201",
    ownerEmail: "alex.chang@superapp.com",
    plan: "Developers",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
  {
    id: "6",
    projectName: "SuperApp",
    projectId: "print-promote-146",
    ownerEmail: "alex.chang@superapp.com",
    plan: "Free",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
  {
    id: "7",
    projectName: "SuperApp",
    projectId: "print-promote-147",
    ownerEmail: "alex.chang@superapp.com",
    plan: "Free",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
  {
    id: "8",
    projectName: "SuperApp",
    projectId: "print-promote-148",
    ownerEmail: "alex.chang@superapp.com",
    plan: "Free",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
  {
    id: "9",
    projectName: "SuperApp",
    projectId: "print-promote-149",
    ownerEmail: "alex.chang@superapp.com",
    plan: "Free",
    createdAt: "Oct 7, 2025, 5:16:47 PM UTC+08:00",
  },
];

export function getProjectByProjectId(projectId: string): TeamListItem | undefined {
  return MOCK_TEAMS.find((p) => p.projectId === projectId);
}
