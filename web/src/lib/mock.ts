export interface Criterion { id: string; name: string; description: string; weight: number; }
export interface Contest {
  id: number; organizer: string; title: string; description: string;
  criteria: Criterion[]; prize_wei: number; entry_deadline: number;
  max_entries: number; status: string; winner_entry_id: number;
  created_at: number; entry_count: number; scored_count: number;
  appeal_deadline: number; prize_claimed: number;
}
export interface Entry {
  id: number; contest_id: number; creator: string; url: string;
  submitted_at: number; scores: Record<string, number>;
  reasons: Record<string, string>; total_x100: number;
  accessible: boolean; status: string; appeal_count: number;
  resubmissions: number; last_judged_at: number;
}

export const MOCK_MODE = process.env.MOCK_MODE !== "false" && !process.env.NEXT_PUBLIC_VERDIKT_CONTRACT_ADDRESS;

export const mockContests: Contest[] = [
  {
    id: 1, organizer: "0x0000000000000000000000000000000000000001",
    title: "Lens Protocol Launch Page Showdown", description: "Best launch page for a Lens app.",
    criteria: [
      { id: "craft", name: "Craft", description: "Execution quality", weight: 40 },
      { id: "originality", name: "Originality", description: "Fresh ideas", weight: 35 },
      { id: "clarity", name: "Clarity", description: "Clear communication", weight: 25 },
    ],
    prize_wei: 10 * 1e18, entry_deadline: Date.now() / 1000 + 86400,
    max_entries: 20, status: "JUDGING", winner_entry_id: 0,
    created_at: Date.now() / 1000 - 86400, entry_count: 3, scored_count: 3,
    appeal_deadline: 0, prize_claimed: 0,
  },
];

export const mockEntries: Entry[] = [
  { id: 1, contest_id: 1, creator: "0xabc", url: "https://example.com/entry-a", submitted_at: Date.now()/1000-80000, scores: { craft: 9, originality: 8, clarity: 9 }, reasons: { craft: "Polished layout.", originality: "Fresh hero.", clarity: "Message lands fast." }, total_x100: 9*40+8*35+9*25, accessible: true, status: "SCORED", appeal_count: 0, resubmissions: 0, last_judged_at: Date.now()/1000-1000 },
  { id: 2, contest_id: 1, creator: "0xdef", url: "https://example.com/entry-b", submitted_at: Date.now()/1000-70000, scores: { craft: 8, originality: 9, clarity: 7 }, reasons: { craft: "Strong build.", originality: "Novel mechanic.", clarity: "Dense in places." }, total_x100: 8*40+9*35+7*25, accessible: true, status: "SCORED", appeal_count: 0, resubmissions: 0, last_judged_at: Date.now()/1000-1000 },
  { id: 3, contest_id: 1, creator: "0xghi", url: "https://example.com/entry-c", submitted_at: Date.now()/1000-60000, scores: { craft: 7, originality: 7, clarity: 8 }, reasons: { craft: "Clean.", originality: "Safe.", clarity: "Readable." }, total_x100: 7*40+7*35+8*25, accessible: true, status: "SCORED", appeal_count: 0, resubmissions: 0, last_judged_at: Date.now()/1000-1000 },
];

export function mockFeatured() {
  return { contest: mockContests[0], entries: [...mockEntries].sort((a, b) => b.total_x100 - a.total_x100) };
}
