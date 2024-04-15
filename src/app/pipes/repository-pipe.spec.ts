import { RepositoryPipe } from './repository-pipe';

describe('RepositoryPipe', () => {
  const repositoryPipe = new RepositoryPipe();

  it('create an instance', () => {
    expect(repositoryPipe).toBeTruthy();
  });

  it('should return an null if the object is null', () => {
    expect(repositoryPipe.transform(null)).toEqual(null);
  });

  it('should return null if the object is empty', () => {
    expect(repositoryPipe.transform({})).toEqual(null);
  });

  it('should return null if the object does not have required name field', () => {
    expect(repositoryPipe.transform({ key: 'value' })).toEqual(null);
  });

  it('should be truthy if the object has required name field', () => {
    expect(repositoryPipe.transform({ name: 'name' })).toBeTruthy();
  });

  it('should be truthy if the object has all fields', () => {
    expect(
      repositoryPipe.transform({
        name: 'name',
        description: 'descr',
        topics: ['topic1'],
      })
    ).toBeTruthy();
  });
});
