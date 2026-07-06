import { Swords, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DUMMY_WINRATES = [
  { player_name: "흑우1", wins: 8, losses: 2, total: 10, rate: 80 },
  { player_name: "흑우2", wins: 5, losses: 5, total: 10, rate: 50 },
  { player_name: "흑우3", wins: 9, losses: 1, total: 10, rate: 90 },
];

const DUMMY_RECORDS = [
  {
    id: "r1",
    player_name: "흑우1",
    team_title: "여포 브브 칼헬론",
    result: "승" as const,
    opponent: "상대길드A",
    memo: "",
    recorded_at: "2026-07-07",
  },
  {
    id: "r2",
    player_name: "흑우2",
    team_title: "여포 브브 칼헬론",
    result: "패" as const,
    opponent: "상대길드B",
    memo: "막판 뒤집힘",
    recorded_at: "2026-07-07",
  },
];

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Swords size={22} />
            수비 기록
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            길드원별 수비 승패 및 시즌 승률
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-muted-foreground">
            <RotateCcw size={13} />
            시즌 초기화
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus size={14} />
            기록 추가
          </Button>
        </div>
      </div>

      <Tabs defaultValue="winrate">
        <TabsList>
          <TabsTrigger value="winrate">승률 집계</TabsTrigger>
          <TabsTrigger value="history">전체 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="winrate" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">시즌 1 — 길드원 승률</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>닉네임</TableHead>
                    <TableHead className="text-center">승</TableHead>
                    <TableHead className="text-center">패</TableHead>
                    <TableHead className="text-center">승률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DUMMY_WINRATES.map((row) => (
                    <TableRow key={row.player_name}>
                      <TableCell className="font-medium">{row.player_name}</TableCell>
                      <TableCell className="text-center text-blue-400">{row.wins}</TableCell>
                      <TableCell className="text-center text-red-400">{row.losses}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={row.rate >= 70 ? "default" : "secondary"}
                          className={row.rate >= 70 ? "bg-green-600" : ""}
                        >
                          {row.rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>길드원</TableHead>
                    <TableHead>방어팀</TableHead>
                    <TableHead className="text-center">결과</TableHead>
                    <TableHead>상대</TableHead>
                    <TableHead>메모</TableHead>
                    <TableHead>날짜</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DUMMY_RECORDS.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.player_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.team_title}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            r.result === "승"
                              ? "border-blue-500 text-blue-400"
                              : "border-red-500 text-red-400"
                          }
                        >
                          {r.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.opponent}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.memo || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.recorded_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
