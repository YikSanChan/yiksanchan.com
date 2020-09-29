---
title: 广告系统工程实践选读
date: "2020-09-29"
description: 博采众长。
---

# Building a real-time user action counting system for ads

原文：[https://medium.com/pinterest-engineering/building-a-real-time-user-action-counting-system-for-ads-88a60d9c9a](https://medium.com/pinterest-engineering/building-a-real-time-user-action-counting-system-for-ads-88a60d9c9a)

标签：Pinterest、频次控制

为了进行频次控制和对CTR进行实时预测，需要对用户动作进行计数，并支持类似“Pins 1，2和3上周的impression次数”的查询。与计数相关的架构如下，其中Aperture是计数服务。

![用户动作计数服务](./pinterest-user-action-counting-service.png)


Ad insertion会将一个insertion ID插入到广告中，动作事件（action events）发生时，该ID、动作（impression或click）以及viewtype（home feed、search等）会被打包成事件，传入Kafka。

会对动作事件流去重（根据事件的bytes），因为：

- Logging server不保证事件的exactly once delivery。
- 商业逻辑要求去重。

需要在完成事件ingestion后才计数，因为：

- 上述提到商业逻辑要求去重。
- 需要支持复杂的查询，在ingest阶段进行计数precompute的拓展性不佳。

Aperture是一个时间序列数据存储，使用RocksDB作为存储引擎，使用[Rocksplicator](https://medium.com/pinterest-engineering/automated-cluster-management-and-recovery-for-rocksplicator-f1f8fd35c833)进行集群管理。SLA为8ms p99, 200k qps。存储结构如下：

- Key → List[EventId]
- Key = [User Id] + [Time Bucket Type] + [Time Bucket Id]
- Time Bucket Type: D(Day), H(Hour), M(Minute)
- 新的事件到达后，Aperture会计算该事件在不同bucket type下的bucket id，并往对应的三个key写入新的值。