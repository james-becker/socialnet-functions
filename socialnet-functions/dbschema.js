let db = {
  screams: [
    {
      userHandle: 'user',
      body: 'Hello',
      createdAt: '2019-11-06T03:12:54.054Z',
      likeCount: 5,
      // Minimize amount of reads that you execute. If you store commentCount here, you avoid too many reads.
      commentCount: 2
    }
  ]
}