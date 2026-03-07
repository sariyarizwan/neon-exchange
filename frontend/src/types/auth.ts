export type MockUser = {
  displayName: string;
  avatarId: string;
  email: string;
  guest?: boolean;
};

export type MockAuthState = {
  isAuthed: boolean;
  user: MockUser;
};
