export interface User {
  data?: {
    givenName?: string;
    familyName?: string;
    email?: string;
    eid?: string;
    experiments?: [string];
    incentiveLevel?: string;
    incentiveLevelId?: string;
  };
  error?: string;
}
