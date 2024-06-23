export function formatTimeStampToUTC(timeStamp: string) {
  // const d = new Date()
  // const date = d.toISOString().split('T')[0];
  // const time = d.toTimeString().split(' ')[0];
  // return `${date} ${time}`

  return timeStamp.replace(' ', 'T')+"Z"

}