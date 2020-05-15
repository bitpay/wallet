export interface User {
  data?: {
    givenName?: string;
    familyName?: string;
    email?: string;
    eid?: string;
    experiments?: {naDebit?: boolean}
  };
  error?: string;
}
