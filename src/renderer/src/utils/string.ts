export const truncate = (str: string, n: number, e: number) => {
  if (!str) {
    return "";
  }
  if (n > str.length - e) {
    return str;
  }
  return str.substring(0, n - 1) + "..." + str.substring(str.length - e - 1);
};
export const classNames = (
  ...classes: (string | undefined | null | boolean)[]
) => {
  return classes.filter(Boolean).join(" ");
};

export const shortenAddress = (str = "", head = 8, tail = 8) => {
  if (!str) return "";

  const totalLength = head + tail;
  if (str.length > totalLength) {
    return `${str.substring(0, head)}...${str.substring(str.length - tail)}`;
  } else {
    return str;
  }
};

export const readableFileSize = (size: number) => {
  if (size <= 0) return "0 B";

  const units = ["B", "kB", "MB", "GB", "TB", "PB", "EB"];
  const digitGroups = Math.floor(Math.log10(size) / Math.log10(1024));
  const formattedSize = (size / Math.pow(1024, digitGroups)).toFixed(1);

  return `${formattedSize} ${units[digitGroups]}`;
};

export const isURL = (str: string) => {
  const re_weburl = new RegExp(
    "^" +
      // protocol identifier (optional)
      // short syntax // still required
      "(?:(?:(?:https?|ftp):)?\\/\\/)" +
      // user:pass BasicAuth (optional)
      "(?:\\S+(?::\\S*)?@)?" +
      "(?:" +
      // IP address exclusion
      // private & local networks
      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broadcast addresses
      // (first & last IP address of each class)
      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
      "|" +
      // host & domain names, may end with dot
      // can be replaced by a shortest alternative
      // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
      "(?:" +
      "(?:" +
      "[a-z0-9\\u00a1-\\uffff]" +
      "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
      ")?" +
      "[a-z0-9\\u00a1-\\uffff]\\." +
      ")+" +
      // TLD identifier name, may end with dot
      "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
      ")" +
      // port number (optional)
      "(?::\\d{2,5})?" +
      // resource path (optional)
      "(?:[/?#]\\S*)?" +
      "$",
    "i",
  );

  return re_weburl.test(str);
};
