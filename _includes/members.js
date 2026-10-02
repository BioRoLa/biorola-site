// Builds the member lists from _data/members.yml. Order within a list is the
// order of the data file unless noted.

const MONTHS = "JanFebMarAprMayJunJulAugSepOctNovDec";

// "2023.Mar. -present" -> start [2023, 3], end [Infinity]; "2009-2010" -> [2009, 0], [2010, 0]
function periodKey(period) {
  const [start, end = ""] = period.split(/\s*-\s*/);
  const parse = (s) => {
    if (/present/i.test(s)) return [Infinity, 0];
    const m = s.match(/(\d{4})\.?\s*([A-Za-z]{3})?/);
    if (!m) return [0, 0];
    return [Number(m[1]), m[2] ? MONTHS.indexOf(m[2].slice(0, 3)) / 3 + 1 : 0];
  };
  return [...parse(start), ...parse(end)];
}

const compareDesc = (a, b) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i] > a[i] ? 1 : -1;
  return 0;
};

export function currentStudents(members, degree) {
  return members.filter((m) => m.current === degree);
}

// [{ degree, year, people }], newest year first, Ph.D. before M.S. within a year.
export function alumniByYear(members) {
  const groups = new Map();
  for (const m of members) {
    for (const g of m.graduated ?? []) {
      const key = `${g.year}-${g.degree}`;
      if (!groups.has(key)) groups.set(key, { degree: g.degree, year: g.year, people: [] });
      groups.get(key).people.push(m);
    }
  }
  return [...groups.values()].sort((a, b) => b.year - a.year || (a.degree === "phd" ? -1 : 1));
}

// [{ role, period, person }], newest start first, then latest end first.
export function staffList(members) {
  return members
    .flatMap((m) => (m.staff ?? []).map((s) => ({ ...s, person: m })))
    .sort((a, b) => compareDesc(periodKey(a.period), periodKey(b.period)));
}

// Which member list a profile belongs to, for the sidebar highlight.
export function listPageFor(member) {
  if (member.current) return "members_stu_gra.html";
  if (member.graduated?.length) return "members_alu_ms.html";
  if (member.staff?.length) return "members_alu_ra.html";
  return "members_alu_ms.html";
}
