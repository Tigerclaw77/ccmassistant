"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import BasketRenderer from "../../../components/forms/BasketRenderer";

type Question = {
  id: string;
  label: string;
  type: "text" | "yes_no";
};

type Basket = {
  id: string;
  name: string;
  questions: Question[];
};

export default function PublicForm() {
  const [basket, setBasket] = useState<Basket | null>(null);

  useEffect(() => {
    async function load() {
      const token = window.location.pathname.split("/").pop();

      // 1. get assignment
      const { data: assignment } = await supabase
        .from("assignments")
        .select("*")
        .eq("token", token)
        .single();

      if (!assignment) return;

      // 2. get basket
      const { data: basketData } = await supabase
        .from("baskets")
        .select("*")
        .eq("id", assignment.basket_id)
        .single();

      if (basketData) {
        setBasket(basketData);
      }
    }

    load();
  }, []);

  if (!basket) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{basket.name}</h1>
      <BasketRenderer basket={basket} />
    </div>
  );
}
