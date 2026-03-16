import dayjs from "dayjs";

const formatDate = (
  date: string | Date,
  options?: {
    includeTime?: boolean;
  }
) => {
  return dayjs(date).format(
    options?.includeTime ? "DD/MM/YYYY hh:mm A" : "DD/MM/YYYY"
  );
};

export default formatDate;
