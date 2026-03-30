import { Injectable, Logger } from '@nestjs/common';

export interface SanctionsCheckResult {
  matched: boolean;
  matchedList?: string;
  matchScore: number;
  matchedName?: string;
  checkedLists: string[];
}

@Injectable()
export class SanctionsService {
  private readonly logger = new Logger(SanctionsService.name);

  // Mock sanctions lists — in production these would be real OFAC/UN/EU API calls
  private readonly sanctionedEntities = [
    { name: 'Viktor Bout', list: 'OFAC_SDN', aliases: ['Victor Bout', 'Viktor But'] },
    { name: 'Al-Shabaab', list: 'UN_SANCTIONS', aliases: ['Al Shabaab', 'Harakat al-Shabaab'] },
    { name: 'ISIS', list: 'UN_SANCTIONS', aliases: ['ISIL', 'Islamic State', 'Daesh'] },
    { name: 'Hezbollah', list: 'OFAC_SDN', aliases: ['Hizballah'] },
    { name: 'Kim Jong Un', list: 'OFAC_SDN', aliases: ['Kim Jong-un'] },
    { name: 'Hamza bin Laden', list: 'OFAC_SDN', aliases: [] },
    { name: 'Semion Mogilevich', list: 'FBI_MOST_WANTED', aliases: ['Semen Mogilevich'] },
  ];

  private readonly sanctionedWallets = [
    { address: '0xDEAD000000000000000000000000000000000001', list: 'OFAC_SDN', label: 'Tornado Cash' },
    { address: '0xDEAD000000000000000000000000000000000002', list: 'OFAC_SDN', label: 'Lazarus Group' },
    { address: 'bc1qBAD0000000000000000000000000000000000', list: 'OFAC_SDN', label: 'Darknet Market' },
  ];

  private readonly highRiskJurisdictions = ['KP', 'IR', 'SY', 'CU', 'MM', 'BY', 'RU', 'VE'];

  async screenPerson(params: {
    name: string;
    nationalId?: string;
    country?: string;
  }): Promise<SanctionsCheckResult> {
    const checkedLists = ['OFAC_SDN', 'UN_SANCTIONS', 'EU_SANCTIONS', 'FRC_KENYA', 'FBI_MOST_WANTED'];
    const nameNormalized = params.name.toLowerCase().trim();

    for (const entity of this.sanctionedEntities) {
      const allNames = [entity.name, ...entity.aliases].map(n => n.toLowerCase());
      for (const sanctionedName of allNames) {
        // Fuzzy match: check if name contains or is contained by sanctioned name
        if (nameNormalized.includes(sanctionedName) || sanctionedName.includes(nameNormalized)) {
          this.logger.warn(`SANCTIONS MATCH: "${params.name}" matched "${entity.name}" on ${entity.list}`);
          return {
            matched: true,
            matchedList: entity.list,
            matchScore: 95,
            matchedName: entity.name,
            checkedLists,
          };
        }
      }
    }

    // Check high-risk jurisdiction
    if (params.country && this.highRiskJurisdictions.includes(params.country.toUpperCase())) {
      this.logger.warn(`HIGH-RISK JURISDICTION: ${params.country} for "${params.name}"`);
      return {
        matched: false,
        matchScore: 60,
        matchedList: 'JURISDICTION_RISK',
        checkedLists,
      };
    }

    this.logger.log(`Sanctions clear for "${params.name}" — screened against ${checkedLists.length} lists`);
    return { matched: false, matchScore: 0, checkedLists };
  }

  async screenWallet(address: string): Promise<SanctionsCheckResult> {
    const checkedLists = ['OFAC_SDN', 'CHAINALYSIS_SANCTIONS'];
    const addrLower = address.toLowerCase();

    for (const wallet of this.sanctionedWallets) {
      if (wallet.address.toLowerCase() === addrLower) {
        this.logger.warn(`WALLET SANCTIONS MATCH: ${address} — ${wallet.label} on ${wallet.list}`);
        return {
          matched: true,
          matchedList: wallet.list,
          matchScore: 100,
          matchedName: wallet.label,
          checkedLists,
        };
      }
    }

    return { matched: false, matchScore: 0, checkedLists };
  }

  isHighRiskJurisdiction(countryCode: string): boolean {
    return this.highRiskJurisdictions.includes(countryCode.toUpperCase());
  }
}
