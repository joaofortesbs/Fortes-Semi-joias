import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createPersistedOrder, getPrivateProductCost, listPersistedOrders, updatePersistedOrderStatus, upsertPrivateProductCost } from "./db";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  productPrivate: router({
    getCost: adminProcedure.input(z.object({ productId: z.string().min(1) })).query(({ ctx, input }) => getPrivateProductCost(ctx.user.openId, input.productId)),
    saveCost: adminProcedure.input(z.object({ productId: z.string().min(1), costBase: z.number().nonnegative() })).mutation(({ ctx, input }) => upsertPrivateProductCost(ctx.user.openId, input.productId, input.costBase)),
  }),

  orders: router({
    list: adminProcedure.query(({ ctx }) => listPersistedOrders(ctx.user.openId)),
    create: adminProcedure.input(z.object({ id: z.string().min(1), origin: z.enum(["direct", "reseller"]), resellerId: z.string().optional(), status: z.string().min(1), total: z.number().nonnegative(), commission: z.number().nonnegative(), saleDate: z.coerce.date(), payload: z.unknown() })).mutation(({ ctx, input }) => createPersistedOrder(ctx.user.openId, input)),
    updateStatus: adminProcedure.input(z.object({ id: z.string().min(1), status: z.enum(["pending", "approved", "paid", "separating", "shipped", "delivered", "cancelled"]), payload: z.unknown() })).mutation(({ ctx, input }) => updatePersistedOrderStatus(ctx.user.openId, input.id, input.status, input.payload)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
