export interface User {
  data?: {
    givenName?: string;
    familyName?: string;
    email?: string;
    eid?: string;
  };
  error?: string;
}
