export const expiryDateTransformer = 
  (expiryDates) =>
    expiryDates?.map((exp) => ({
      label: exp.date,
      value: exp.expiry,
    })) || [];
