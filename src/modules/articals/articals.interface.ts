export type TArticalsCatagory = "Beginners" | "Advanced" | "Tips";
export const ArticalsEnum = ["Beginners", "Advanced", "Tips"];
export type TArticals = {
  titile: string;
  category: TArticalsCatagory;
  image?: {
    publicFileURL: string;
    path: string;
  };
  content: string;
};
