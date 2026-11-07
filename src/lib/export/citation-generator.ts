import { ResearchIdentity } from "@/types/research-explorer";

export interface FormattedCitations {
  citationKey: string;
  bibtex: string;
  apa: string;
  ieee: string;
  harvard: string;
  chicago: string;
  latexCite: string;
}

/**
 * Generates clean, standard academic citations across all major reference styles.
 */
export function generateAcademicCitations(identity: ResearchIdentity): FormattedCitations {
  const title = (identity.title || "Academic Research Study").replace(/\.$/, "");
  const authors = identity.authors && identity.authors.length > 0 ? identity.authors : ["Anonymous Researcher"];
  const year = identity.publicationYear ? String(identity.publicationYear) : new Date().getFullYear().toString();
  const venue = identity.journalOrConference || (identity.arxivId ? `arXiv preprint arXiv:${identity.arxivId}` : "Preprint");
  const doi = identity.doi || "";
  const doiUrl = doi ? (doi.startsWith("http") ? doi : `https://doi.org/${doi}`) : "";

  // 1. Generate Citation Key: e.g., he2016deep
  const firstAuthorLast = getLastName(authors[0]).toLowerCase().replace(/[^a-z]/g, "") || "author";
  const firstWordTitle = title.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "") || "paper";
  const citationKey = `${firstAuthorLast}${year}${firstWordTitle}`;

  // 2. BibTeX format
  const bibAuthors = authors.map((a) => formatAuthorForBibtex(a)).join(" and ");
  const bibtex = `@article{${citationKey},
  title     = {${title}},
  author    = {${bibAuthors}},
  journal   = {${venue}},
  year      = {${year}}${doi ? `,\n  doi       = {${doi}}` : ""}${doiUrl ? `,\n  url       = {${doiUrl}}` : ""}
}`;

  // 3. APA 7th Edition: Author, A. A., & Author, B. B. (Year). Title. Venue. DOI
  const apaAuthors = formatAuthorsAPA(authors);
  const apa = `${apaAuthors} (${year}). ${title}. ${venue}.${doiUrl ? ` ${doiUrl}` : ""}`;

  // 4. IEEE: [1] A. A. Author and B. B. Author, "Title," Venue, Year.
  const ieeeAuthors = formatAuthorsIEEE(authors);
  const ieee = `${ieeeAuthors}, "${title}," ${venue}, ${year}.${doi ? ` doi: ${doi}.` : ""}`;

  // 5. Harvard: Author, A. (Year) 'Title', Venue. Available at: DOI
  const harvardAuthors = formatAuthorsHarvard(authors);
  const harvard = `${harvardAuthors} (${year}) '${title}', ${venue}.${doiUrl ? ` Available at: ${doiUrl}` : ""}`;

  // 6. Chicago (Author-Date): Author, Firstname. Year. "Title." Venue.
  const chicagoAuthors = formatAuthorsChicago(authors);
  const chicago = `${chicagoAuthors}. ${year}. "${title}." ${venue}.${doiUrl ? ` ${doiUrl}` : ""}`;

  // 7. LaTeX in-text cite command
  const latexCite = `\\cite{${citationKey}}`;

  return {
    citationKey,
    bibtex,
    apa,
    ieee,
    harvard,
    chicago,
    latexCite,
  };
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  return parts[parts.length - 1] || fullName;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase() + ".";
  const firstInitials = parts.slice(0, -1).map((p) => p.charAt(0).toUpperCase() + ".").join(" ");
  return firstInitials;
}

function formatAuthorForBibtex(author: string): string {
  const parts = author.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, -1).join(" ");
  return `${lastName}, ${firstNames}`;
}

function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 1) {
    const lastName = getLastName(authors[0]);
    const initials = getInitials(authors[0]);
    return `${lastName}, ${initials}`;
  }
  if (authors.length === 2) {
    return `${getLastName(authors[0])}, ${getInitials(authors[0])}, & ${getLastName(authors[1])}, ${getInitials(authors[1])}`;
  }
  if (authors.length <= 20) {
    const formatted = authors.map((a) => `${getLastName(a)}, ${getInitials(a)}`);
    const allExceptLast = formatted.slice(0, -1).join(", ");
    return `${allExceptLast}, & ${formatted[formatted.length - 1]}`;
  }
  return `${getLastName(authors[0])}, ${getInitials(authors[0])}, et al.`;
}

function formatAuthorsIEEE(authors: string[]): string {
  if (authors.length === 1) {
    return `${getInitials(authors[0])} ${getLastName(authors[0])}`;
  }
  if (authors.length <= 3) {
    const list = authors.map((a) => `${getInitials(a)} ${getLastName(a)}`);
    return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
  }
  return `${getInitials(authors[0])} ${getLastName(authors[0])} et al.`;
}

function formatAuthorsHarvard(authors: string[]): string {
  if (authors.length === 1) {
    return `${getLastName(authors[0])}, ${getInitials(authors[0])}`;
  }
  if (authors.length <= 3) {
    const list = authors.map((a) => `${getLastName(a)}, ${getInitials(a)}`);
    return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
  }
  return `${getLastName(authors[0])} et al.`;
}

function formatAuthorsChicago(authors: string[]): string {
  if (authors.length === 1) {
    return formatAuthorForBibtex(authors[0]);
  }
  if (authors.length <= 3) {
    const first = formatAuthorForBibtex(authors[0]);
    const others = authors.slice(1).join(", ");
    return `${first}, and ${others}`;
  }
  return `${formatAuthorForBibtex(authors[0])} et al.`;
}
